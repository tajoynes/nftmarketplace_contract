//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;

    constructor() ERC721("SCVNGR HNT", "SCVT") {}

    function mint(string memory _tokenURI) external returns (uint256) {
        tokenIds.increment();
        uint256 tokenId = tokenIds.current();
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        return tokenId;
    }
}
