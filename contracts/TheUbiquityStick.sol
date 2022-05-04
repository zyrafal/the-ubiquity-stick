// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ITheUbiquityStick.sol";

/// @title OpenNFTs smartcontract
/// @notice With "The UbiquiStick" NFT contract, you can :
/// @notice - get all ERC721 functionnality https://eips.ethereum.org/EIPS/eip-721
/// @notice   - including check that someone as a NFT of the collection with « balanceOf »
/// @notice   - including check who is TokenID owner with « ownerOf »
/// @notice   - including optional ERC721Metadata
/// @notice     but without metadata JSON schema
/// @notice     with 3 types of NFTs : standard, gold and invisible, each one having same metadata
/// @notice     with 3 different tokenURIs
/// @notice   - including optional ERC721Enumerable
/// @notice - get you NFT listed on OpenSea (on mainnet or matic only)
/// @notice  - allow NFT owner to burn it’s own NFT
/// @notice - allow one owner (deployer at start) to change tokenURIs (setTokenURI),
/// @notice   and change minter (setMinter) and transfer it's owner role to someone else
/// @notice - allow one minter to mint NFT (safeMint)
contract TheUbiquityStick is ITheUbiquityStick, ERC721, ERC721Burnable, ERC721Enumerable, ERC2981, Ownable {
  ///
  /// @notice tokenID of next minted NFT
  /// @notice equal to the number of NFT already minted
  uint256 public tokenIdNext = 1;

  /// @notice MINTER address
  address public minter;

  /// @notice STANDARD NFT
  string private _tokenURI;
  uint256 private constant STANDARD_TYPE = 0;

  /// @notice GOLD NFT
  string private _goldTokenURI;
  mapping(uint256 => bool) public gold;
  uint256 private constant GOLD_FREQ = 64;
  uint256 private constant GOLD_TYPE = 1;

  /// @notice INVISIBLE NFT
  string private _invisibleTokenURI;
  uint256 private constant INVISIBLE_TOKEN_ID = 42;
  uint256 private constant INVISIBLE_TYPE = 2;

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
  /// @notice First owner is the deployer
  constructor(string[] memory tokenURIs) ERC721("The UbiquiStick", "KEY") {
    setMinter(msg.sender);
    setTokenURI(0, tokenURIs[0]);
    setTokenURI(1, tokenURIs[1]);
    setTokenURI(2, tokenURIs[2]);
  }

  /// @notice GET tokenURI
  /// @param tokenID : tokenID to get tokenURI
  /// @return uri of the token
  function tokenURI(uint256 tokenID) public view override(ERC721) returns (string memory uri) {
    require(_exists(tokenID), "Nonexistent token");

    if (_existsMutable(tokenID)) uri = _tokenURIs[tokenID];
    else if (gold[tokenID]) uri = _goldTokenURI;
    else if (tokenID == INVISIBLE_TOKEN_ID) uri = _invisibleTokenURI;
    else uri = _tokenURI;
  }

  /// @notice SET tokenURI, only allowed to minter
  /// @param ntype : NFT type : STANDARD_TYPE 0, GOLD_TYPE 1 or INVISIBLE_TYPE 2
  /// @param newTokenURI : token URI associated with the type
  function setTokenURI(uint256 ntype, string memory newTokenURI) public override(ITheUbiquityStick) onlyMinter {
    if (ntype == STANDARD_TYPE) {
      _tokenURI = newTokenURI;
    } else if (ntype == GOLD_TYPE) {
      _goldTokenURI = newTokenURI;
    } else if (ntype == INVISIBLE_TYPE) {
      _invisibleTokenURI = newTokenURI;
    }
  }

  /// @notice SET tokenMutableURI, only allowed to owner
  /// @param tokenID : token ID
  /// @param newTokenMutableURI : token URI
  function setTokenMutableURI(uint256 tokenID, string memory newTokenMutableURI)
    public
    override(ITheUbiquityStick)
    onlyNftOwner(tokenID)
  {
    _tokenURIs[tokenID] = newTokenMutableURI;
  }

  /// @notice SET minter only allowed to owner
  /// @param minter_ : minter address
  function setMinter(address minter_) public override(ITheUbiquityStick) onlyOwner {
    minter = minter_;
  }

  /// @notice MINT function only allowed to minter
  /// @param to : owner address of the minted NFT
  function safeMint(address to) public override(ITheUbiquityStick) onlyMinter {
    uint256 tokenID = tokenIdNext;
    tokenIdNext += 1;

    // Gold one
    if (random() % uint256(GOLD_FREQ) == 0) {
      if (tokenID != INVISIBLE_TOKEN_ID) gold[tokenID] = true;
    }
    _safeMint(to, tokenID);
  }

  /// @notice BATCH MINT function only allowed to minter
  /// @param to : owner address of the minted NFTs
  /// @param count : number of NFTs to mint for the owner
  function batchSafeMint(address to, uint256 count) public override(ITheUbiquityStick) onlyMinter {
    for (uint256 i = 0; i < count; i++) {
      safeMint(to);
    }
  }

  /// @notice pseudo random function
  function random() private view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender, tokenIdNext)));
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenID
  ) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenID);
  }

  function _existsMutable(uint256 tokenID) internal view virtual returns (bool) {
    return bytes(_tokenURIs[tokenID]).length > 0;
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable, ERC2981)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  function setDefaultRoyalty(address receiver, uint96 feeNumerator) public onlyMinter {
    _setDefaultRoyalty(receiver, feeNumerator);
  }

  function setTokenRoyalty(
    uint256 tokenId,
    address receiver,
    uint96 feeNumerator
  ) public onlyMinter {
    _setTokenRoyalty(tokenId, receiver, feeNumerator);
  }

  function resetTokenRoyalty(uint256 tokenId) public onlyMinter {
    _resetTokenRoyalty(tokenId);
  }

  function deleteDefaultRoyalty() public onlyMinter {
    _deleteDefaultRoyalty();
  }
}
