// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ITheUbiquiStickSale.sol";

contract TheUbiquiStickSale is Ownable, ReentrancyGuard {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  struct Purchase {
    uint256 count;
    uint256 price;
  }

  // TheUbiquiStick token contract interface
  ITheUbiquiStick public tokenContract;

  // Stores the allowed minting count and token price for each whitelisted address
  mapping(address => Purchase) private _allowances;
  // Stores the list of purchases along with the pricing
  mapping(address => Purchase[]) private _purchases;

  // Stores the addresse of the treasury
  address public fundsAddress;

  uint256 public constant MAXIMUM_SUPPLY = 1024;
  address private constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  event DustSent(address _to, address token, uint256 amount);

  constructor() {}

  // Add this modifier to all functions which are only accessible by the finance related addresses
  modifier onlyFinance() {
    require(msg.sender == fundsAddress, "Unauthorized Access");
    _;
  }

  function setTokenContract(address _newTokenContract) external onlyOwner {
    require(_newTokenContract != address(0), "Invalid Address");
    tokenContract = ITheUbiquiStick(_newTokenContract);
  }

  function setFundsAddress(address _address) external onlyOwner {
    require(_address != address(0), "Invalid Address");
    fundsAddress = _address;
  }

  // Set the allowance for the specified address
  function setAllowance(
    address _address,
    uint256 _count,
    uint256 _price
  ) public onlyOwner {
    require(_address != address(0), "Invalid Address");
    _allowances[_address] = Purchase(_count, _price);
  }

  // Set the allowance for the specified address
  function batchSetAllowances(
    address[] calldata _addresses,
    uint256[] calldata _counts,
    uint256[] calldata _prices
  ) external onlyOwner {
    uint256 count = _addresses.length;

    for (uint16 i = 0; i < count; i++) {
      setAllowance(_addresses[i], _counts[i], _prices[i]);
    }
  }

  // Get the allowance for the specified address
  function allowance(address _address) public view returns (uint256 count, uint256 price) {
    Purchase memory _allowance = _allowances[_address];
    count = _allowance.count;
    price = _allowance.price;
  }

  // Handles token purchases
  receive() external payable nonReentrant {
    // Check if tokens are still available for sale
    uint256 remainingTokenCount = MAXIMUM_SUPPLY - tokenContract.totalSupply();
    require(remainingTokenCount > 0, "Sold Out");

    // Check if sufficient funds are sent, and that the address is whitelisted (has valid allowance)
    // with enough funds to purchase at least 1 token
    uint256 accountLimit;
    uint256 tokenPrice;
    (accountLimit, tokenPrice) = allowance(msg.sender);
    require(accountLimit > 0, "Not Whitelisted For The Sale Or Insufficient Allowance");
    require(msg.value >= tokenPrice, "Insufficient Funds");

    // Calculate the actual amount of tokens to be minted, which must be within the set limits
    uint256 specifiedAmount = (tokenPrice == 0 ? accountLimit : msg.value.div(tokenPrice));
    uint256 actualAmount = (specifiedAmount > accountLimit ? accountLimit : specifiedAmount);
    actualAmount = (remainingTokenCount < actualAmount ? remainingTokenCount : actualAmount);
    _allowances[msg.sender].count -= actualAmount;
    tokenContract.batchSafeMint(msg.sender, actualAmount);

    uint256 totalSpent = actualAmount.mul(tokenPrice);
    if (totalSpent > 0) {
      _purchases[msg.sender].push(Purchase(actualAmount, tokenPrice));
    }

    // Calculate any excess/unspent funds and transfer it back to the buyer
    uint256 unspent = msg.value.sub(totalSpent);
    if (unspent > 0) {
      payable(msg.sender).transfer(unspent);
    }
  }

  function _sendDust(
    address _to,
    address _token,
    uint256 _amount
  ) internal nonReentrant onlyFinance {
    require(_to != address(0), "Can't send to zero address");
    if (_token == ETH_ADDRESS) {
      payable(_to).transfer(_amount);
    } else {
      IERC20(_token).safeTransfer(_to, _amount);
    }
    emit DustSent(_to, _token, _amount);
  }
}
