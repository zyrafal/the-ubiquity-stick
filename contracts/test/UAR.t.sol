// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.3;

import "ds-test/test.sol";
import "../UAR.sol";

contract UARTest is DSTest {
  UAR uar;

  function setUp() public {
    uar = new UAR("uAR", "UAR", address(this));
  }

  function testName() public {
    assertEq(uar.name(), "uAR");
  }

  function testSymbol() public {
    assertEq(uar.symbol(), "UAR");
  }
}
