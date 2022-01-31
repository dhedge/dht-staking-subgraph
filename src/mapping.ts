import {
  dataSource,
  log,
  Address,
  ethereum,
  BigInt,
} from '@graphprotocol/graph-ts';
import {
  DaoChanged as DaoChangedEvent,
  Deposit as DepositEvent,
  Expired as ExpiredEvent,
  ProtocolDaoChanged as ProtocolDaoChangedEvent,
  Withdraw as WithdrawEvent,
} from '../generated/IncentivisedVotingLockup/IncentivisedVotingLockup';
import {
  DaoChanged,
  Deposit,
  Expired,
  ProtocolDaoChanged,
  Withdraw,
  StakingContract,
} from '../generated/schema';

export function handleDaoChanged(event: DaoChangedEvent): void {
  let entity = new DaoChanged(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );
  entity.previousDao = event.params.previousDao;
  entity.newDao = event.params.newDao;

  let id = dataSource.address().toHexString();
  let stakingContract = new StakingContract(id);

  // first set balance to zero
  stakingContract.balance = BigInt.fromI32(0);
  stakingContract.save();

  entity.save();
}

export function handleDeposit(event: DepositEvent): void {
  let entity = new Deposit(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );

  let id = dataSource.address().toHexString();
  let stakingContract = StakingContract.load(id);
  if (!stakingContract) {
    stakingContract = new StakingContract(id);
  }

  stakingContract.balance = event.params.value.plus(stakingContract.balance);
  stakingContract.save();

  entity.provider = event.params.provider;
  entity.value = event.params.value;
  entity.locktime = event.params.locktime;
  entity.action = event.params.action;
  entity.ts = event.params.ts;
  entity.blockNumber = event.block.number.toI32();
  entity.save();
}

export function handleExpired(event: ExpiredEvent): void {
  let entity = new Expired(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );

  entity.save();
}

export function handleProtocolDaoChanged(event: ProtocolDaoChangedEvent): void {
  let entity = new ProtocolDaoChanged(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );
  entity.previousProtocolDao = event.params.previousProtocolDao;
  entity.newProtocolDao = event.params.newProtocolDao;
  entity.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  let entity = new Withdraw(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );

  let id = dataSource.address().toHexString();
  let stakingContract = StakingContract.load(id);
  if (!stakingContract) {
    stakingContract = new StakingContract(id);
  }

  stakingContract.balance = stakingContract.balance.minus(event.params.value);
  stakingContract.save();

  entity.provider = event.params.provider;
  entity.value = event.params.value;
  entity.ts = event.params.ts;
  entity.save();
}
