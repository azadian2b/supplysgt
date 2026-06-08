import { __testing, SortDirection } from './GraphQLDataStoreCompat';
import { Soldier, UICMembershipRequest, User } from '../models';

describe('GraphQLDataStoreCompat predicate mapping', () => {
  it('maps simple equality predicates to GraphQL filters', () => {
    expect(__testing.filterFromPredicate(u => u.owner.eq('user@example.com'))).toEqual({
      owner: { eq: 'user@example.com' }
    });
  });

  it('maps chained onboarding approval predicates', () => {
    expect(
      __testing.filterFromPredicate(r =>
        r.userID.eq('user-1').and(r.uicID.eq('uic-1')).and(r.status.eq('PENDING'))
      )
    ).toEqual({
      and: [
        {
          and: [
            { userID: { eq: 'user-1' } },
            { uicID: { eq: 'uic-1' } }
          ]
        },
        { status: { eq: 'PENDING' } }
      ]
    });
  });

  it('maps or and in predicates used by approval queues', () => {
    expect(
      __testing.filterFromPredicate(u =>
        u.or(u => [
          u.uicID.eq('uic-1'),
          u.id.eq('user-1')
        ])
      )
    ).toEqual({
      or: [
        { uicID: { eq: 'uic-1' } },
        { id: { eq: 'user-1' } }
      ]
    });

    expect(
      __testing.filterFromPredicate(r =>
        r.status.eq('PENDING').and(r.uicID.in(['uic-1', 'uic-2']))
      )
    ).toEqual({
      and: [
        { status: { eq: 'PENDING' } },
        { uicID: { in: ['uic-1', 'uic-2'] } }
      ]
    });
  });

  it('maps DataStore-style sort callbacks', () => {
    expect(__testing.sortFromOptions({ sort: s => s.lastName(SortDirection.ASCENDING) })).toEqual({
      field: 'lastName',
      direction: SortDirection.ASCENDING
    });
  });

  it('limits mutation inputs to GraphQL model fields', () => {
    const user = new User({
      id: 'user-1',
      owner: 'owner',
      firstName: 'Test',
      lastName: 'User',
      rank: 'SGT',
      role: 'SOLDIER',
      uicID: 'uic-1',
      extraClientOnlyField: true,
      __typename: 'User'
    });

    expect(__testing.cleanInput(__testing.operationMap.User, user, 'create')).toEqual({
      id: 'user-1',
      owner: 'owner',
      firstName: 'Test',
      lastName: 'User',
      rank: 'SGT',
      role: 'SOLDIER',
      uicID: 'uic-1'
    });
  });

  it('keeps current model maps for key migrated screens', () => {
    expect(__testing.operationMap.User.list).toBe('listUsers');
    expect(__testing.operationMap.Soldier.create).toBe('createSoldier');
    expect(__testing.operationMap.UICMembershipRequest.update).toBe('updateUICMembershipRequest');
    expect(Soldier.modelName).toBe('Soldier');
    expect(UICMembershipRequest.modelName).toBe('UICMembershipRequest');
  });
});
