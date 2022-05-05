// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

// FORK from Land DAO -> https://github.com/Land-DAO/nft-contracts/blob/main/contracts/LandSale.sol

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "./interfaces/ITheUbiquityStick.sol";
import "./interfaces/ITheUbiquityStickSale.sol";

contract TheUbiquityStickSale is ITheUbiquityStickSale, Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  struct Purchase {
    uint256 count;
    uint256 price;
  }

  // TheUbiquityStick token contract interface
  address public tokenContract;

  // Stores the allowed minting count and token price for each whitelisted address
  mapping(address => Purchase) private _allowances;

  // Stores the address of the treasury
  address public fundsAddress;

  uint256 public constant MAXIMUM_SUPPLY = 1024;
  uint256 public constant MAXIMUM_PER_TX = 10;



  // Handles token purchases
  receive() external payable override(ITheUbiquityStickSale) nonReentrant {
    // Check if tokens are still available for sale
    require(IERC721Enumerable(tokenContract).totalSupply() < MAXIMUM_SUPPLY, "Sold Out");
    uint256 remainingTokenCount = MAXIMUM_SUPPLY - IERC721Enumerable(tokenContract).totalSupply();

    // Check if sufficient funds are sent, and that the address is whitelisted
    // and had enough allowance with enough funds
    uint256 count;
    uint256 price;
    (count, price) = allowance(msg.sender);
    require(count > 0, "Not Whitelisted or no Allowance");

    if (remainingTokenCount < count) count = remainingTokenCount;
    if (msg.value < count * price) count = msg.value / price;
    if (MAXIMUM_PER_TX < count) count = MAXIMUM_PER_TX;
    require(count > 0, "Not enough Funds");

    _allowances[msg.sender].count -= count;

    uint256 paid = count * price;
    ITheUbiquityStick(tokenContract).batchSafeMint(msg.sender, count);
    emit Mint(msg.sender, count, paid);

    // Calculate any excess/unspent funds and transfer it back to the buyer
    if (msg.value > paid) {
      uint256 unspent = msg.value - paid;
      payable(msg.sender).transfer(unspent);
      emit Payback(msg.sender, unspent);
    }
  }

  function setTokenContract(address newTokenContract) external override(ITheUbiquityStickSale) onlyOwner {
    require(newTokenContract != address(0), "Invalid Address");
    tokenContract = newTokenContract;
  }

  function setFundsAddress(address addr) external override(ITheUbiquityStickSale) onlyOwner {
    require(addr != address(0), "Invalid Address");
    fundsAddress = addr;
  }

  // Set the allowance for the specified address
  function batchSetAllowances(
    address[] calldata addresses,
    uint256[] calldata counts,
    uint256[] calldata prices
  ) external override(ITheUbiquityStickSale) onlyOwner {
    uint256 count = addresses.length;

    for (uint16 i = 0; i < count; i++) {
      setAllowance(addresses[i], counts[i], prices[i]);
    }
  }

  function withdraw() external override(ITheUbiquityStickSale) nonReentrant onlyOwner {
    payable(fundsAddress).transfer(address(this).balance);
  }

  // Set the allowance for the specified address
  function setAllowance(
    address addr,
    uint256 count,
    uint256 price
  ) public override(ITheUbiquityStickSale) onlyOwner {
    require(addr != address(0), "Invalid Address");
    _allowances[addr] = Purchase(count, price);
  }

  // Get the allowance for the specified address
  function allowance(address addr) public view override(ITheUbiquityStickSale) returns (uint256 count, uint256 price) {
    Purchase memory allowance_ = _allowances[addr];
    count = allowance_.count;
    price = allowance_.price;
  }
}
