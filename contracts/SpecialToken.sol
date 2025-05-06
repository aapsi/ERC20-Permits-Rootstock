// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title ERC20 Token Contract
/// @notice Implements an ERC20 token with permit functionality.
/// @dev Inherits from OpenZeppelin's:
///      - ERC20: Standard ERC20 implementation
///      - Ownable: Ownership management
///      - ERC20Permit: Permit-based approvals
contract SpecialToken is ERC20, Ownable, ERC20Permit {
    // Custom errors for gas efficiency
    error InvalidToken();
    error InvalidRecipient();
    error InvalidAmount();
    error InsufficientBalance();

    uint256 public constant MAX_TOTAL_SUPPLY = 1000000000 * 10 ** 18; // 1 billion tokens with 18 decimals

    event EmergencyWithdraw(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );

    /// @notice Initializes the Score token contract.
    /// @param owner Address receiving the initial max token supply.
    /// @dev Mints the max token supply to the owner.
    constructor(
        address owner
    ) ERC20("SpecialToken", "SPT") ERC20Permit("SpecialToken") Ownable(owner) {
        _mint(owner, MAX_TOTAL_SUPPLY);
    }

    /// @notice Fetches the maximum total supply of the token.
    /// @return MAX_TOTAL_SUPPLY The maximum total supply of the token.
    function maxSupply() public pure returns (uint256) {
        return MAX_TOTAL_SUPPLY;
    }

    /// @notice Allows the owner to emergency withdraw tokens from the contract.
    /// @param token The address of the token to withdraw.
    /// @param recipient The address of the recipient.
    /// @param amount The amount of tokens to withdraw.
    function emergencyWithdraw(
        address token,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        // Gas efficient checks using custom errors
        if (token == address(0)) revert InvalidToken();
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();

        // Check balance using cached address
        if (amount > IERC20(token).balanceOf(address(this)))
            revert InsufficientBalance();

        // Transfer tokens
        IERC20(token).transfer(recipient, amount);

        emit EmergencyWithdraw(token, recipient, amount);
    }
}
