const Voting = artifacts.require("./Voting.sol");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');


contract("Voting", accounts => {

  const _owner = accounts[0];
  const _voters = [accounts[1], accounts[2], accounts[3]];
  const _proposals = ['Proposal1', 'Proposal2', 'Proposal3'];
  const _votes = [1, 1, 2];
  const _notOwner = accounts[8];
  const _notVoter = accounts[9];
  let VotingInstance;

  /**********************************************************************/
  /***we check that we are on a good basis to start the Voting session***/
  /**********************************************************************/ 
  describe("Initial settings Voting session", function () {
    before(async function () {
      VotingInstance = await Voting.deployed();
    });

    it("Workflow should be in status RegisteringVoters", async () => {
      const stateWF = await VotingInstance.workflowStatus.call();
      expect(stateWF).to.be.bignumber.equal(BN(0));
    });

    it("winningProposalID should be 0", async () => {
      const BeforeWinningProposalID = await VotingInstance.winningProposalID();
      expect(BeforeWinningProposalID).to.be.bignumber.equal(BN(0));
    });

    after(async function () {
      VotingInstance = null;
    });
  });


  /**********************************************************************/
  /***Before starting session, we check scope of owner --> all revert****/
  /**********************************************************************/ 
  describe("Owner possible actions", function () {
    beforeEach(async function () {
      VotingInstance = await Voting.new({ from: _owner });
    });

    it('reverts when notOwner add a voter', async function () {
      await expectRevert(
        VotingInstance.addVoter(_voters[0], { from: _notOwner }),
        'Ownable: caller is not the owner',
      );
    });

    it('reverts when notOwner StartProposalRegistering', async () => {
      await expectRevert(VotingInstance.startProposalsRegistering({ 'from': _voters[0] }), "Ownable: caller is not the owner");
    });

    it('reverts when notOwner endProposalRegistering', async () => {
      await expectRevert(VotingInstance.endProposalsRegistering({ 'from': _voters[1] }), "Ownable: caller is not the owner");
    });

    it('reverts when notOwner startVotingSession', async () => {
      await expectRevert(VotingInstance.startVotingSession({ 'from': _voters[2] }), "Ownable: caller is not the owner");
    });
    it('reverts when notOwner endVotingSession ', async () => {
      await expectRevert(VotingInstance.endVotingSession({ 'from': _voters[0] }), "Ownable: caller is not the owner");
    });
    it('reverts when notOwner tallyVotes', async () => {
      await expectRevert(VotingInstance.tallyVotes({ 'from': _voters[1] }), "Ownable: caller is not the owner");
    });

    after(async function () {
      VotingInstance = null;
    });
  });


  /**********************************************************************/
  /***We start the process , first step -> we test 'Add voter' **********/
  /**********************************************************************/ 
  describe("Add a Voter", function () {
    before(async function () {
      VotingInstance = await Voting.deployed();
    });

    //Checking that we can register
    it("registration before/after OK", async () => {
      //We add first voter0
      await VotingInstance.addVoter(_voters[0], { from: _owner });
      //We check that voter1 is not registered yet before adding him then we add him and check again
      const voter1BeforeRegister = await VotingInstance.getVoter(_voters[1], { from: _voters[0] });
      expect(voter1BeforeRegister.isRegistered).to.equal(false);
      await VotingInstance.addVoter(_voters[1], { from: _owner });
      const voter1AfterRegister = await VotingInstance.getVoter(_voters[1], { from: _voters[0] });
      expect(voter1AfterRegister.isRegistered).to.equal(true);
    });

    //Check that we canno't add voter more than 1 time
    it("reverts when voter is added twice", async () => {
      await expectRevert(
        VotingInstance.addVoter(_voters[0], { from: _owner }), "Already registered");
    });

    // Check event emit when adding new voter
    it("emit a VoterRegistered event", async () => {
      expectEvent(
        await VotingInstance.addVoter(_voters[2], { from: _owner, }), "VoterRegistered", { voterAddress: _voters[2] });
    });

  });

  /**********************************************************************/
  /***We check the scope of voters now before moving on the process******/
  /**********************************************************************/ 
  describe("Voter possible actions", function () {

    const Proposal = 'étaler la formation sur 4 mois';
    before(async function () {
      VotingInstance = await Voting.new({ from: _owner });
      for (const _voter of _voters) {
        await VotingInstance.addVoter(_voter, { from: _owner });
      }
    });

    it('reverts if not a Voter call getVoter', async () => {
      await expectRevert(VotingInstance.getVoter(_voters[0], { 'from': _notVoter }), "You're not a voter");
    });
    it('reverts if not a Voter call getOneProposal', async () => {
      await expectRevert(VotingInstance.getOneProposal(0, { 'from': _notVoter }), "You're not a voter");
    });
    it('reverts  if not a Voter addProposal', async () => {
      await expectRevert(VotingInstance.addProposal(Proposal, { 'from': _notVoter }), "You're not a voter");
    });
    it('reverts  if not a Voter setVote', async () => {
      await expectRevert(VotingInstance.setVote(0, { 'from': _notVoter }), "You're not a voter");
    });
  });

  after(async function () {
    VotingInstance = null;
  });

  /**********************************************************************/
  /******************We start the proposal registration******************/
  /**********************************************************************/ 
  describe("Start Proposal Registering", function () {

    before(async function () {
      VotingInstance = await Voting.new({ from: _owner });
    });

    //Check WFchange event emit when starting proposal registration -> ProposalsRegistrationStarted
    it("emit event WorkflowStatusChange to ProposalsRegistrationStarted", async () => {
      expectEvent( await VotingInstance.startProposalsRegistering({ from: _owner, }), "WorkflowStatusChange", { previousStatus: new BN(0), newStatus: new BN(1) } );
    });

    // Check workflowStatus = ProposalsRegistrationStarted
    it("Check workflowStatus set to ProposalsRegistrationStarted", async function () {
      const workflowStatus = await VotingInstance.workflowStatus.call();
      expect(workflowStatus).to.be.bignumber.equal(new BN(1));
    });

    //we check that we canno't add voter from now on
    it("revert when workflow is not RegisteringVoters", async () => {
      await expectRevert(
        VotingInstance.addVoter(_notVoter, { from: _owner }),
        "Voters registration is not open yet"
      );
    });
  });


  /**********************************************************************/
  /*************************We add the proposals*************************/
  /**********************************************************************/ 
  describe("add Proposal", function () {
    before(async function () {
      VotingInstance = await Voting.deployed();
      await VotingInstance.startProposalsRegistering({ from: _owner });
      //Adding proposals
      for (const [i, _proposal] of _proposals.entries()) {
        if (i > 1) break; //let 2 for event testing
        await VotingInstance.addProposal(_proposal, { from: _voters[i] });
      }

    });

    it("Check added proposal", async function () {
      const proposal = await VotingInstance.getOneProposal(1, { from: _voters[0] });
      expect(proposal.description).equal(_proposals[0]); //because of GENESIS
    });

    it("reverts if description is empty", async () => {
      await expectRevert(VotingInstance.addProposal("", { from: _voters[0] }), "Vous ne pouvez pas ne rien proposer");
    });

    //Check WFchange event emit when proposal registration -> ProposalRegistered
    it("emit a ProposalRegistered event", async () => {
      expectEvent( await VotingInstance.addProposal(_proposals[2], { from: _voters[2], }), "ProposalRegistered", { proposalId: new BN(3) } );
    });

  });


  /**********************************************************************/
  /********************we end the proposal registration*******************/
  /**********************************************************************/
  describe("end Proposals Registering", function () {
    before(async function () {
      VotingInstance = await Voting.deployed();
    });

    it("reverts if owner try to start Voting session before endProposalsRegistering", async () => {
      await expectRevert(
        VotingInstance.startVotingSession({ from: _owner }),
        "Registering proposals phase is not finished"
      );
    });

    //Check WFchange event emit when ending proposal registration -> endProposalsRegistering
    it("emit event WorkflowStatusChange to endProposalsRegistering", async () => {
      expectEvent(
        await VotingInstance.endProposalsRegistering({ from: _owner, }), "WorkflowStatusChange", { previousStatus: new BN(1), newStatus: new BN(2) } );});

    // Check workflowStatus = endProposalsRegistering
    it("Check workflowStatus set to endProposalsRegistering", async function () {
      const workflowStatus = await VotingInstance.workflowStatus.call();
      expect(workflowStatus).to.be.bignumber.equal(new BN(2));
    });

    // check that we canno't add a proposal
    it("reverts if proposals are not allowed anymore", async () => {
      // await VotingInstance.endProposalsRegistering();
      await expectRevert(VotingInstance.addProposal("Proposal that is too late", { from: _voters[0] }), "Proposals are not allowed yet");
    });

  });

  /**********************************************************************/
  /********************we start the Voting*******************************/
  /**********************************************************************/
  describe("start Voting", function () {
    before(async function () {
      VotingInstance = await Voting.deployed();
    });

    it("revert if we try to vote before Voting session started", async () => {
      await expectRevert(  VotingInstance.setVote(_votes[0], { from: _voters[0] }), "Voting session havent started yet");
    });

    //Check WFchange event emit when start Voting Session -> startVotingSession
    it("emit event WorkflowStatusChange to startVotingSession", async () => {
      expectEvent(await VotingInstance.startVotingSession({ from: _owner, }), "WorkflowStatusChange", { previousStatus: new BN(2), newStatus: new BN(3) });
    });

    // Check workflowStatus = VotingSessionStarted
    it("Check workflowStatus set to VotingSessionStarted", async function () {
      const workflowStatus = await VotingInstance.workflowStatus.call();
      expect(workflowStatus).to.be.bignumber.equal(new BN(3));
    });

  });

  /**********************************************************************/
  /********************we set the Voting*******************************/
  /**********************************************************************/
  describe("set Vote", function () {
    before(async function () {
      VotingInstance = await Voting.deployed();
    });
  //check updated flag for voter person
    it("voter updated flags( hasvoted and votedProposalId) after setVote", async function () {
      await VotingInstance.setVote(_votes[0], { from: _voters[0] });
      const voter0 = await VotingInstance.getVoter(_voters[0], { from: _voters[0] });
      expect(voter0.hasVoted).to.be.true;
      expect(voter0.votedProposalId).to.be.bignumber.equal(new BN(1));
    });
  //Counting of votes check
    it("voteCount Before/After OK", async function () {
      const firstProposalVoteCountBefore = await VotingInstance.getOneProposal(1, { from: _voters[0] }); //Normally 1
      await VotingInstance.setVote(_votes[1], { from: _voters[1] });
      const firstProposalVoteCountAfter = await VotingInstance.getOneProposal(1, { from: _voters[0] });
      expect(firstProposalVoteCountAfter.voteCount).to.be.bignumber.equal(
        BN(2)  //Normally 2
      );
    });

    it("revert if voter voted more than one time", async () => {
      await expectRevert(VotingInstance.setVote(_voters[0], { from: _voters[0] }), "You have already voted");
    });

    it("reverts if proposal is not a valid one", async () => {
      await expectRevert(VotingInstance.setVote(10, { from: _voters[2] }), "Proposal not found");
    });

    //Check Voted event emit when set a vote 
    it("emit a Voted event", async () => {
      expectEvent(await VotingInstance.setVote(2, { from: _voters[2], }), "Voted", { voter: _voters[2], proposalId: new BN(2) });
    });

  });


  /**********************************************************************/
  /********************we end the Voting*********************************/
  /**********************************************************************/
  describe("end Voting", function () {
    before(async function () {
      VotingInstance = await Voting.deployed();
    });

    //Owner cannot tally vote before end of Voting session
    it("reverts if owner try to tally Votes before end Voting session", async () => {
      await expectRevert(
        VotingInstance.tallyVotes({ from: _owner }),
        "Current status is not voting session ended"
      );
    });

    //Check WFchange event emit when starting proposal registration -> endVotingSession
    it("emit event WorkflowStatusChange to endVotingSession", async () => {
      expectEvent(
        await VotingInstance.endVotingSession({ from: _owner, }), "WorkflowStatusChange", { previousStatus: new BN(3), newStatus: new BN(4) });
    });

    // Check workflowStatus = VotingSessionStarted
    it("Check workflowStatus set to VotingSessionEnded", async function () {
      const workflowStatus = await VotingInstance.workflowStatus.call();
      expect(workflowStatus).to.be.bignumber.equal(new BN(4));
    });

  });

  /**********************************************************************/
  /************************ Tally Votes *********************************/
  /**********************************************************************/
  describe("tally Votes", function () {
    before(async function () {
      VotingInstance = await Voting.deployed();
    });

    //Check WFchange event emit after tallyVotes -> VotesTallied
    it("emit event WorkflowStatusChange to VotesTallied", async () => {
      //it("emit a WorkflowStatusChange event", async () => {
      expectEvent(await VotingInstance.tallyVotes({ from: _owner, }), "WorkflowStatusChange", { previousStatus: new BN(4), newStatus: new BN(5) });
    });

    // Check workflowStatus = VotesTallied
    it("Check workflowStatus set to VotesTallied", async function () {
      const workflowStatus = await VotingInstance.workflowStatus.call();
      expect(workflowStatus).to.be.bignumber.equal(new BN(5));
    });
  });

  /**********************************************************************/
  /******************* Last step , get winningProposalId ****************/
  /**********************************************************************/
  describe("set winningProposalId", function () {
    before(async function () {
      VotingInstance = await Voting.deployed();
    });
    it("get winningProposalId", async function () {
      const winningProposalId = await VotingInstance.winningProposalID.call();
      expect(winningProposalId).to.be.bignumber.equal(new BN(1));
    });
  });
  after(async function () {
    VotingInstance = null;
  });
});


