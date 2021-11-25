// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract UbiquityAlgorithmicDollarManager is AccessControl {
  bytes32 public constant UBQ_MINTER_ROLE = keccak256("UBQ_MINTER_ROLE");

  constructor() {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(UBQ_MINTER_ROLE, msg.sender);
  }
}
