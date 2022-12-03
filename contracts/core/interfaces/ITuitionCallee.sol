// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface ITuitionCallee {
    function tuitionCall(address sender, uint amount0, uint amount1, bytes calldata data) external;
}
