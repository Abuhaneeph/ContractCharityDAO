// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./libraries/Enums.sol";
import "./libraries/Models.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract Governance is Ownable{
    using Counters for Counters.Counter;

    uint256 private constant DEADLINE = 2 * 60 ;

    uint16 private _threshold = 50; // default
    uint256 private _minVoting = 1;
    uint256 private _minPropose = 1;
    uint64 private _minDuration = 5;
    uint256 private _minBalance= 20 * 10 ** 18;
    bool private _earlyExecution;

    Counters.Counter private _proposalId;

    mapping(uint256 => Models.Proposal) private _proposals;
    mapping(uint256 => mapping(address => Enums.VoteEntry))  private _voteEntries;

   IERC20 Governance_Token_Address;

       struct Charity {
        address charityAddress;
        string name;
        uint256 registrationNumber;
        string documentURI;
        bool isApproved;
    }

    mapping(uint256 => Charity) public charities;
    mapping(address => bool) public isRegistered;
    Charity[] public approvedCharities;

    Counters.Counter private registrationNumberCounter;


    event CharityRegistered(
        address indexed charityAddress,
        string name,
        uint256 registrationNumber,
        string documentURI
    );
    event CharityApproved(uint256 indexed charity_ID);
    event CharityDisapproved(uint256 indexed charity_ID);
    event ProposalCreated(uint256 proposalId);
    event ProposalVoted(
        address voter,
        uint256 proposalId,
        Enums.VoteEntry voteEntry
    );
    event ProposalExecuted(uint256 proposalId);

    event ProposalUnVoted(address voter, uint256 proposalId);

    constructor(
     address _Governance_Token_Address 
        
    ) Ownable(msg.sender){
        Governance_Token_Address= IERC20(_Governance_Token_Address);
     
    }


function registerCharity(
        string memory _name,
         string memory _documentURI,
         address _charityAddress
    ) external {
        require(!isRegistered[_charityAddress], "Charity already registered");
        registrationNumberCounter.increment();
        Charity memory newCharity = Charity({
            charityAddress: _charityAddress,
            name: _name,
            registrationNumber: registrationNumberCounter.current(),
            documentURI: _documentURI,
            isApproved: false
        });

        charities[registrationNumberCounter.current()] = newCharity;

        emit CharityRegistered(msg.sender, _name, registrationNumberCounter.current(), _documentURI);
    }

 function approveCharity(uint256 _charity_reg_no) external onlyOwner {
      require(_charity_reg_no != 0 ,"Invalid Reg No");
      address _charity_address= charities[_charity_reg_no].charityAddress;
         require(isRegistered[_charity_address], "Charity not registered");
        require(charities[_charity_reg_no].isApproved == false , "Charity already approved");

        charities[_charity_reg_no].isApproved = true;
        approvedCharities.push(charities[_charity_reg_no]);

        emit CharityApproved(_charity_reg_no);
    }

    function disapproveCharity(uint256 _charity_reg_no) external onlyOwner {
              require(_charity_reg_no != 0 ,"Invalid Reg No");
              address _charity_address= charities[_charity_reg_no].charityAddress;
               require(isRegistered[_charity_address], "Charity not registered");
             require(!charities[_charity_reg_no].isApproved, "Charity not approved");
               charities[_charity_reg_no].isApproved = false;
            emit CharityDisapproved(_charity_reg_no);
    }







 

    // STATE CHANGING FUNCTIONS
   function createProposal(
    string memory metadata_,
    uint256 durationInSeconds,  // Duration for the proposal in seconds
    string memory treasurySummary_

) external {
   require(Governance_Token_Address.balanceOf(msg.sender) >= _minBalance,"Your Balance must be equal to or greater than 20 STREAL ");
    _proposalId.increment();
    uint256 proposalId = _proposalId.current();

    uint256 startedOn_ = block.timestamp;  // Current time
    uint256 endedOn_ = startedOn_ + durationInSeconds;  // Calculate end time

    require(
        durationInSeconds >= DEADLINE,  // Ensure the voting period is at least DEADLINE seconds
        "VOTING_PERIOD_TOO_SHORT"
    );

    Models.Proposal memory proposal = Models.Proposal({
        metadata: metadata_,
        createdOn: block.timestamp,
        startedOn: startedOn_,
        endedOn: endedOn_,
        creator: _msgSender(),
        treasurySummary: treasurySummary_,
        voters: new address[](0),
        executedOn: 0
    });

    _proposals[proposalId] = proposal;

    emit ProposalCreated(proposalId);
}



    function executeProposal(
        uint256 proposalId
    ) external  onlyOwner {
        Models.Proposal storage proposal = _proposals[proposalId];

        require(proposal.executedOn == 0, "ALREADY_EXECUTED");

        (uint256 agree, uint256 disagree, uint256 abstain) = result(proposalId);
        uint256 totalVotes = (agree + disagree + abstain);

        if (!_earlyExecution) {
            require(proposal.endedOn < block.timestamp, "PROPOSAL_NOT_ENDED");
        }

        if (proposal.endedOn < block.timestamp) {
            proposal.endedOn = block.timestamp;
        }

        proposal.executedOn = block.timestamp;

        require(
            ((agree * 100) / totalVotes) >= _threshold,
            "THRESHOLD_NOT_MET"
        );

        emit ProposalExecuted(proposalId);

     
    }

    function voteProposal(
        uint256 proposalId,
        Enums.VoteEntry voteEntry
    ) external  {
        require(Governance_Token_Address.balanceOf(msg.sender) >= _minBalance,"Your Balance must be equal to or greater than 20 STREAL ");

        Models.Proposal storage proposal = _proposals[proposalId];

        require(proposal.creator != msg.sender,"CREATOR_NOT_AUTHORIZED_TO_VOTE");

       require(block.timestamp < proposal.endedOn, "VOTING_HAS_ENDED");

        require(proposal.executedOn == 0, "PROPOSAL_HAS_BEEN_EXECUTED");

        for (uint256 index = 0; index < proposal.voters.length; index++) {
            if (proposal.voters[index] == msg.sender) {
                revert("ALREADY_VOTED");
            }
        }

        _voteEntries[proposalId][msg.sender] = voteEntry;
        proposal.voters.push(msg.sender);

        emit ProposalVoted(msg.sender, proposalId, voteEntry);
    }

    function unVoteProposal(
        uint256 proposalId
    ) external   {
        
        Models.Proposal storage proposal = _proposals[proposalId];
 require(block.timestamp < proposal.endedOn, "VOTING_HAS_ENDED");
        delete _voteEntries[proposalId][msg.sender];

        for (uint256 index = 0; index < proposal.voters.length; index++) {
            if (proposal.voters[index] == msg.sender) {
                delete proposal.voters[index];
            }
        }

        emit ProposalUnVoted(msg.sender, proposalId);
    }

    // STATE VIEWING FUNCTIONS

    function getProposal(
        uint256 proposalId
    ) external view  returns (Models.Proposal memory) {
        return _proposals[proposalId];
    }

    function threshold() external view returns (uint16) {
        return _threshold;
    }

    function minVoting() external view returns (uint256) {
        return _minVoting;
    }

    function minPropose() external view returns (uint256) {
        return _minPropose;
    }

    function minDuration() external view returns (uint64) {
        return _minDuration;
    }

    function earlyExecution() external view returns (bool) {
        return _earlyExecution;
    }

    function getVoteEntries(
        uint256 proposalId
    ) external view returns (address[] memory, Enums.VoteEntry[] memory) {
        address[] memory voters = _proposals[proposalId].voters;
        Enums.VoteEntry[] memory voteEntries = new Enums.VoteEntry[](
            voters.length
        );

        for (uint256 index = 0; index < voters.length; index++) {
            voteEntries[index] = _voteEntries[proposalId][voters[index]];
        }

        return (voters, voteEntries);
    }

    function result(
        uint256 proposalId
    ) public view returns (uint256 agree, uint256 disagree, uint256 abstain) {
        address[] memory voters = _proposals[proposalId].voters;

        for (uint256 index = 0; index < voters.length; index++) {
            address voter = voters[index];

            if (_voteEntries[proposalId][voter] == Enums.VoteEntry.Agree) {
                agree++;
            } else if (
                _voteEntries[proposalId][voter] == Enums.VoteEntry.Disagree
            ) {
                disagree++;
            } else {
                abstain++;
            }
        }
    }

    function lastId() external view returns (uint256) {
        return _proposalId.current();
    }
}
