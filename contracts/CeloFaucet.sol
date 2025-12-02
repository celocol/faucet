// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CeloColombiaFaucet
 * @notice A faucet contract for distributing CELO and cCOP tokens on Alfajores testnet
 * @dev Supports different claim amounts based on verification levels
 */
contract CeloColombiaFaucet is Ownable, ReentrancyGuard {
    // Token contract
    IERC20 public ccopToken;

    // Claim amounts (in wei, need to multiply by 10^18)
    uint256 public constant BASIC_CELO_AMOUNT = 1 ether;
    uint256 public constant BASIC_CCOP_AMOUNT = 1 ether;

    uint256 public constant TWITTER_CELO_AMOUNT = 5 ether;
    uint256 public constant TWITTER_CCOP_AMOUNT = 5 ether;

    uint256 public constant SELF_CELO_AMOUNT = 10 ether;
    uint256 public constant SELF_CCOP_AMOUNT = 10 ether;

    // Cooldown period (24 hours)
    uint256 public constant COOLDOWN_PERIOD = 24 hours;

    // Verification levels
    enum VerificationLevel {
        NONE,
        GITHUB,
        TWITTER,
        SELF
    }

    // User claim info
    struct ClaimInfo {
        uint256 lastClaimTime;
        VerificationLevel lastVerificationLevel;
        uint256 totalCeloClaimed;
        uint256 totalCcopClaimed;
    }

    // Mapping from user address to claim info
    mapping(address => ClaimInfo) public claims;

    // Mapping to track verified users
    mapping(address => bool) public githubVerified;
    mapping(address => bool) public twitterVerified;
    mapping(address => bool) public selfVerified;

    // Backend verifier address (for off-chain verification)
    address public verifier;

    // Events
    event Claimed(
        address indexed user,
        uint256 celoAmount,
        uint256 ccopAmount,
        VerificationLevel verificationLevel
    );

    event VerificationUpdated(
        address indexed user,
        VerificationLevel verificationType,
        bool verified
    );

    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    event TokensWithdrawn(address indexed token, uint256 amount);

    /**
     * @notice Constructor
     * @param _ccopToken Address of the cCOP token contract
     * @param _verifier Address that can verify users off-chain
     */
    constructor(
        address _ccopToken,
        address _verifier
    ) Ownable(msg.sender) {
        require(_ccopToken != address(0), "Invalid cCOP token address");
        require(_verifier != address(0), "Invalid verifier address");

        ccopToken = IERC20(_ccopToken);
        verifier = _verifier;
    }

    /**
     * @notice Claim tokens (called by user, requires signature from verifier)
     * @param verificationLevel The level of verification
     * @param signature Signature from verifier
     */
    function claim(
        VerificationLevel verificationLevel,
        bytes memory signature
    ) external nonReentrant {
        require(verificationLevel != VerificationLevel.NONE, "Must have verification");
        require(canClaim(msg.sender), "Cooldown period not elapsed");

        // Verify signature
        bytes32 messageHash = getMessageHash(msg.sender, verificationLevel);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        require(recoverSigner(ethSignedMessageHash, signature) == verifier, "Invalid signature");

        // Determine amounts based on verification level
        (uint256 celoAmount, uint256 ccopAmount) = getClaimAmounts(verificationLevel);

        // Update claim info
        ClaimInfo storage userClaim = claims[msg.sender];
        userClaim.lastClaimTime = block.timestamp;
        userClaim.lastVerificationLevel = verificationLevel;
        userClaim.totalCeloClaimed += celoAmount;
        userClaim.totalCcopClaimed += ccopAmount;

        // Transfer tokens
        require(address(this).balance >= celoAmount, "Insufficient CELO in faucet");
        require(ccopToken.balanceOf(address(this)) >= ccopAmount, "Insufficient cCOP in faucet");

        (bool success, ) = msg.sender.call{value: celoAmount}("");
        require(success, "CELO transfer failed");

        require(ccopToken.transfer(msg.sender, ccopAmount), "cCOP transfer failed");

        emit Claimed(msg.sender, celoAmount, ccopAmount, verificationLevel);
    }

    /**
     * @notice Check if user can claim
     * @param user Address to check
     * @return bool True if user can claim
     */
    function canClaim(address user) public view returns (bool) {
        ClaimInfo memory userClaim = claims[user];
        return block.timestamp >= userClaim.lastClaimTime + COOLDOWN_PERIOD;
    }

    /**
     * @notice Get time until next claim
     * @param user Address to check
     * @return uint256 Seconds until next claim (0 if can claim now)
     */
    function timeUntilNextClaim(address user) public view returns (uint256) {
        ClaimInfo memory userClaim = claims[user];
        if (canClaim(user)) {
            return 0;
        }
        return (userClaim.lastClaimTime + COOLDOWN_PERIOD) - block.timestamp;
    }

    /**
     * @notice Get claim amounts for verification level
     * @param level Verification level
     * @return celoAmount Amount of CELO
     * @return ccopAmount Amount of cCOP
     */
    function getClaimAmounts(VerificationLevel level)
        public
        pure
        returns (uint256 celoAmount, uint256 ccopAmount)
    {
        if (level == VerificationLevel.GITHUB) {
            return (BASIC_CELO_AMOUNT, BASIC_CCOP_AMOUNT);
        } else if (level == VerificationLevel.TWITTER) {
            return (TWITTER_CELO_AMOUNT, TWITTER_CCOP_AMOUNT);
        } else if (level == VerificationLevel.SELF) {
            return (SELF_CELO_AMOUNT, SELF_CCOP_AMOUNT);
        }
        revert("Invalid verification level");
    }

    /**
     * @notice Get message hash for signature verification
     */
    function getMessageHash(
        address user,
        VerificationLevel level
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, level));
    }

    /**
     * @notice Get Ethereum signed message hash
     */
    function getEthSignedMessageHash(bytes32 messageHash)
        public
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
    }

    /**
     * @notice Recover signer from signature
     */
    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature)
        public
        pure
        returns (address)
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    /**
     * @notice Split signature into r, s, v
     */
    function splitSignature(bytes memory sig)
        public
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    /**
     * @notice Update verifier address (only owner)
     */
    function updateVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "Invalid verifier address");
        address oldVerifier = verifier;
        verifier = newVerifier;
        emit VerifierUpdated(oldVerifier, newVerifier);
    }

    /**
     * @notice Withdraw CELO from contract (only owner)
     */
    function withdrawCelo(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Transfer failed");
        emit TokensWithdrawn(address(0), amount);
    }

    /**
     * @notice Withdraw cCOP tokens from contract (only owner)
     */
    function withdrawCcop(uint256 amount) external onlyOwner {
        require(ccopToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(ccopToken.transfer(owner(), amount), "Transfer failed");
        emit TokensWithdrawn(address(ccopToken), amount);
    }

    /**
     * @notice Get contract balances
     */
    function getBalances() external view returns (uint256 celoBalance, uint256 ccopBalance) {
        return (address(this).balance, ccopToken.balanceOf(address(this)));
    }

    /**
     * @notice Receive function to accept CELO
     */
    receive() external payable {}
}
