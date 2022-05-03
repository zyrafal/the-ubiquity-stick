// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ITheUbiquityStick {
  function setTokenURI(uint256 ntype, string memory newTokenURI) external;

  function setTokenMutableURI(uint256 tokenID, string memory newTokenMutableURI) external;

  function setMinter(address minter_) external;

  function safeMint(address to) external;

  function batchSafeMint(address, uint256) external;
}
