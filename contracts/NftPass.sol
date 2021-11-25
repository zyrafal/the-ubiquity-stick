// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IUBQManager.sol";

contract NftPass is ERC721, ERC721Burnable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIdCounter;

  address public manager;
  string private _tokenURI;

  modifier onlyMinter() {
    require(
      IUBQManager(manager).hasRole(IUBQManager(manager).UBQ_MINTER_ROLE(), msg.sender),
      "Governance token: not minter"
    );
    _;
  }

  constructor(address _manager) ERC721("The UbiquiStick", "KEY") {
    manager = _manager;
  }

  function safeMint(address to) public onlyMinter {
    uint256 tokenId = _tokenIdCounter.current();
    _tokenIdCounter.increment();
    _safeMint(to, tokenId);
  }

  function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
    require(_exists(tokenId), "Nonexistent token");
    return _tokenURI;
  }

  function _burn(uint256 tokenId) internal override(ERC721) {
    super._burn(tokenId);
  }

  function setTokenURI(string memory tokenURI_) public onlyMinter {
    _tokenURI = tokenURI_;
  }
}
