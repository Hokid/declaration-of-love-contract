pragma solidity ^0.4.24;

import "./Ownable.sol";
import "./ReentrancyGuard.sol";

contract DeclarationOfLove is Ownable, ReentrancyGuard {
    uint public price = 100;
    address[] public senders;
    mapping( address => Record ) public records;
    mapping (address => address[] ) public myLikes;
    mapping( address => mapping( address => bool) ) public myLikeMark;

    event RecordAdded(address indexed sender, string fromName, string toName);
    event Liked(address indexed sender, address indexed receiver);
    event Donate(address indexed sender, uint amount);

    struct Record {
        uint timestamp;
        address sender;
        string fromName;
        string toName;
        string body;
        uint likes;
    }

    function add(string fromName, string toName, string body) public payable {
        bytes memory _fromName = bytes(fromName);
        bytes memory _toName = bytes(toName);
        bytes memory _body = bytes(body);

        require(_fromName.length > 0);
        require(_toName.length > 0);
        require(_body.length > 0);
        require(records[msg.sender].timestamp == 0);
        require(msg.value >= price);

        records[msg.sender] = Record({
            timestamp: now,
            sender: msg.sender,
            fromName: fromName,
            toName: toName,
            body: body,
            likes: 0
        });

        senders.push(msg.sender);

        emit RecordAdded(msg.sender, fromName, toName);

        donate();
    }

    function like(address sender) public {
        require(sender != address(0));
        require(records[sender].timestamp != 0);
        require(!myLikeMark[msg.sender][sender]);

        myLikeMark[msg.sender][sender] = true;
        myLikes[msg.sender].push(sender);
        records[sender].likes += 1;

        emit Liked(msg.sender, sender);
    }

    function recordOf(address sender) public view returns (uint timestamp, string fromName, string toName, string body, uint likes) {
        sender = sender == address(0) ? msg.sender : sender;

        return (
            records[sender].timestamp,
            records[sender].fromName,
            records[sender].toName,
            records[sender].body,
            records[sender].likes
        );
    }

    function donate() public payable nonReentrant {
        uint amount = address(this).balance;

        owner.transfer(address(this).balance);

        emit Donate(msg.sender, amount);
    }

    function setPrice(uint newPrice) public onlyOwner {
        price = newPrice;
    }
}
