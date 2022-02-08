// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Price is Ownable {
    /// @notice PriceFeeds per token pair
    mapping(string => address) public priceFeeds;

    /// @notice PriceFeeds per token pair
    /// @param pairs token pairs
    /// @param addresses priceFeed addresses
    constructor(string[] memory pairs, address[] memory addresses) {
        require(pairs.length == addresses.length, "Invalid constructor params");

        for (uint256 i = 0; i < pairs.length; i++) {
            addPriceFeed(pairs[i], addresses[i]);
        }
    }

    /// @notice Add priceFed
    /// @param pair token pair
    /// @param addr priceFeed addresse
    function addPriceFeed(string memory pair, address addr) public onlyOwner {
        priceFeeds[pair] = addr;
    }

    /// @notice Returns latest price
    function getLatestPrice(string calldata pair) public view returns (int256 price) {
        require(priceFeeds[pair] != address(0), "Inexistant pair");

        (, price, , , ) = AggregatorV3Interface(priceFeeds[pair]).latestRoundData();
    }
}
