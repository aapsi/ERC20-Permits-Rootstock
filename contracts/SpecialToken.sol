// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title ERC20 Token Contract
/// @notice Implements an ERC20 token with permit functionality.
/// @dev Inherits from OpenZeppelin's:
///      - ERC20: Standard ERC20 implementation
///      - Ownable: Ownership management
///      - ERC20Permit: Permit-based approvals
contract SpecialToken is ERC20, Ownable, ERC20Permit {
    uint256 public constant MAX_TOTAL_SUPPLY = 1000000000 * 10 ** 18; // 1 billion tokens with 18 decimals

    event EmergencyWithdraw(address token, address recipient, uint256 amount);

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

    /// @notice Updates the token transfer state
    /// @param from Address of the sender
    /// @param to Address of the recipient
    /// @param value Amount of tokens to transfer
    /// @dev Overrides required by Solidity for both ERC20 and ERC20Permit
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Permit) {
        super._update(from, to, value);
    }
}
