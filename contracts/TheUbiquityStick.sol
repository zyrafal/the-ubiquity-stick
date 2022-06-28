// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ITheUbiquityStick.sol";

/// @title TheUbiquityStick smartcontract
contract TheUbiquityStick is ITheUbiquityStick, ERC721, ERC721Burnable, ERC721Enumerable, ERC2981, Ownable {
  ///
  /// @notice tokenID of next minted NFT
  /// @notice also equal to the number of NFT already minted
  uint256 public tokenIdNext = 1;

  /// @notice MINTER address
  address public minter;

  /// @notice STANDARD NFT
  string private _tokenURI;
  uint256 private constant _STANDARD_TYPE = 0;

  /// @notice GOLD NFT
  string private _goldTokenURI;
  mapping(uint256 => bool) public gold;
  uint256 private constant _GOLD_FREQ = 64;
  uint256 private constant _GOLD_TYPE = 1;

  /// @notice INVISIBLE NFT
  string private _invisibleTokenURI;
  uint256 private constant _INVISIBLE_TOKEN_ID = 42;
  uint256 private constant _INVISIBLE_TYPE = 2;

  /// @notice MUTABLE NFTs mapping tokenURI
  mapping(uint256 => string) private _tokenURIs;

  /// @notice onlyMinter, only minter
  modifier onlyMinter() {
    require(msg.sender == minter, "Not minter");
    _;
  }

  /// @notice onlyNftOwner, only NFT owner
  modifier onlyNftOwner(uint256 tokenID) {
    require(msg.sender == ownerOf(tokenID), "Not NFT owner");
    _;
  }

  /// @notice TheUbiquityStick constructor
  /// @notice The deployer is the first owner
  constructor(string[] memory tokenURIs) ERC721("The UbiquiStick", "KEY") {
    setMinter(msg.sender);
    setTokenURI(0, tokenURIs[0]);
    setTokenURI(1, tokenURIs[1]);
    setTokenURI(2, tokenURIs[2]);
  }

  /// @notice SET tokenMutableURI, only allowed to owner
  /// @param tokenID : token ID
  /// @param newTokenMutableURI : token URI
  function setTokenMutableURI(uint256 tokenID, string memory newTokenMutableURI)
    external
    override(ITheUbiquityStick)
    onlyNftOwner(tokenID)
  {
    _tokenURIs[tokenID] = newTokenMutableURI;
    emit SetTokenMutableURI(tokenID, newTokenMutableURI);
  }

  /// @notice BATCH MINT function only allowed to minter
  /// @param to : owner address of the minted NFTs
  /// @param count : number of NFTs to mint for the owner
  function batchSafeMint(address to, uint256 count) external override(ITheUbiquityStick) onlyMinter {
    for (uint256 i = 0; i < count; i++) {
      safeMint(to);
    }
  }

  /// @notice SET default royalty configuration
  /// @param receiver : address of the royalty receiver
  /// @param feeNumerator : fee Numerator, over 10000
  function setDefaultRoyalty(address receiver, uint96 feeNumerator) external override(ITheUbiquityStick) onlyMinter {
    _setDefaultRoyalty(receiver, feeNumerator);
    emit SetDefaultRoyalty(receiver, feeNumerator);
  }

  /// @notice SET token royalty configuration
  /// @param tokenID : token ID
  /// @param receiver : address of the royalty receiver
  /// @param feeNumerator : fee Numerator, over 10000
  function setTokenRoyalty(
    uint256 tokenID,
    address receiver,
    uint96 feeNumerator
  ) external override(ITheUbiquityStick) onlyMinter {
    _setTokenRoyalty(tokenID, receiver, feeNumerator);
    emit SetTokenRoyalty(tokenID, receiver, feeNumerator);
  }

  /// @notice RESET token royalty configuration
  /// @param tokenID : token ID
  function resetTokenRoyalty(uint256 tokenID) external override(ITheUbiquityStick) onlyMinter {
    _resetTokenRoyalty(tokenID);
    emit SetTokenRoyalty(tokenID, address(0), 0);
  }

  /// @notice DELETE default royalty configuration
  function deleteDefaultRoyalty() external override(ITheUbiquityStick) onlyMinter {
    _deleteDefaultRoyalty();
    emit SetDefaultRoyalty(address(0), 0);
  }

  /// @notice SET tokenURI, only allowed to minter
  /// @param ntype : NFT type : _STANDARD_TYPE 0, _GOLD_TYPE 1 or _INVISIBLE_TYPE 2
  /// @param newTokenURI : token URI associated with the type
  function setTokenURI(uint256 ntype, string memory newTokenURI) public override(ITheUbiquityStick) onlyMinter {
    if (ntype == _STANDARD_TYPE) {
      _tokenURI = newTokenURI;
    } else if (ntype == _GOLD_TYPE) {
      _goldTokenURI = newTokenURI;
    } else if (ntype == _INVISIBLE_TYPE) {
      _invisibleTokenURI = newTokenURI;
    }
    emit SetTokenURI(ntype, newTokenURI);
  }

  /// @notice SET minter only allowed to owner
  /// @param minter_ : minter address
  function setMinter(address minter_) public override(ITheUbiquityStick) onlyOwner {
    require(minter_ != address(0), "Minter cannot be 0 address");

    minter = minter_;
    emit SetMinter(minter);
  }

  /// @notice MINT function only allowed to minter
  /// @param to : owner address of the minted NFT
  function safeMint(address to) public override(ITheUbiquityStick) onlyMinter {
    uint256 tokenID = tokenIdNext;
    tokenIdNext += 1;

    // Gold one
    if ((_random() % uint256(_GOLD_FREQ)) == 0) {
      if (tokenID != _INVISIBLE_TOKEN_ID) gold[tokenID] = true;
    }
    _safeMint(to, tokenID);
  }

  /// @notice Override supported interfaces
  /// @param interfaceId : interface ID
  /// @return true if the interface is implemented
  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable, ERC2981)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  /// @notice GET tokenURI
  /// @param tokenID : token ID
  /// @return uri : token URI
  function tokenURI(uint256 tokenID) public view override(ERC721) returns (string memory uri) {
    require(_exists(tokenID), "Nonexistent token");

    if (_existsMutable(tokenID)) uri = _tokenURIs[tokenID];
    else if (gold[tokenID]) uri = _goldTokenURI;
    else if (tokenID == _INVISIBLE_TOKEN_ID) uri = _invisibleTokenURI;
    else uri = _tokenURI;
  }

  /// @notice Override bdefore token trnsfer
  /// @param from : owner address of the sender
  /// @param to : owner address of the receiver
  /// @param tokenID : token ID of the NFT
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenID
  ) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenID);
  }

  /// @notice Does tokenID exists and mutable ?
  /// @return true if the interface is supported
  function _existsMutable(uint256 tokenID) internal view virtual returns (bool) {
    return bytes(_tokenURIs[tokenID]).length > 0;
  }

  /// @notice pseudo random function
  /// @return random number
  function _random() private view returns (uint256) {
    // solhint-disable-next-line not-rely-on-time
    return uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender, tokenIdNext)));
  }
}
