// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "./interfaces/IUBQManager.sol";

contract NftPass is ERC721, ERC721Burnable {
  uint256 public tokenIdNext;
  address private _manager;
  string private _tokenURI;

  mapping(uint256 => bool) public gold;
  string private _tokenGoldURI;
  uint256 private randomfreq = 64;

  modifier onlyMinter() {
    require(
      IUBQManager(_manager).hasRole(IUBQManager(_manager).UBQ_MINTER_ROLE(), msg.sender),
      "Governance token: not minter"
    );
    _;
  }

  constructor(address manager_) ERC721("The UbiquiStick", "KEY") {
    _manager = manager_;
  }

  function safeMint(address to) public onlyMinter {
    uint256 tokenId = tokenIdNext;
    tokenIdNext += 1;
    if (random() % uint256(randomfreq) == 0) {
      gold[tokenId] = true;
    }
    _safeMint(to, tokenId);
  }

  function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
    require(_exists(tokenId), "Nonexistent token");
    return gold[tokenId] ? _tokenGoldURI : _tokenURI;
  }

  function setTokenURI(string memory tokenURI_) public onlyMinter {
    _tokenURI = tokenURI_;
  }

  function setTokenGoldURI(string memory tokenGoldURI_) public onlyMinter {
    _tokenGoldURI = tokenGoldURI_;
  }

  function random() private view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender, tokenIdNext)));
  }
}
