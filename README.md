
# Alyra Voting.sol Unitary test with Truffle

This is a project for Unitary tests of the second Alyra project - Voting.sol


## Authors

- [@sigueninni](https://github.com/sigueninni/)


## Unitary tests Blocs( "describe" ):

- Initial settings Voting session
- Owner possible actions
- Add a Voter
- Voter possible actions
- Start Proposal Registering
- add Proposal
- end Proposals Registering
- start Voting
- set Vote
- end Voting
- tally Votes
- set winningProposalId


## Documentation

- Initial settings Voting session : Testing that initial settings for voting session are ok.
- Owner possible actions : Testing all reverts if not owner tries to do owner actions scope.
- Add a Voter : Testing adding voter + revert if added twice + event
- Voter possible actions : Testing all reverts if not voter tries to do voter actions scope.
- Start Proposal Registering : Testing WF change + WFStatus state + respect of flow of actions
- add Proposal : Testing Proposal is valid + proposal has been added + respect of flow of actions
- end Proposals Registering : Testing WF change + WFStatus state + respect of flow of actions
- start Voting : Testing WF change + WFStatus state + respect of flow of actions 
- set Vote : Testing that Tally votes do proper counting of votes  + reverts( vote twice + voteKey not valid) + proper event
- end Voting : Testing WF change + WFStatus state + respect of flow of actions
- tally Votes : Testing WF change
- set winningProposalId  : Testing that we get back correct winingProposalID.


