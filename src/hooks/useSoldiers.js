import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';

const client = generateClient(); // Define client outside of the hook

/**
 * Custom hook for managing soldiers data
 */
const useSoldiers = (uicID) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [soldiers, setSoldiers] = useState([]);
  const [soldiersMap, setSoldiersMap] = useState({});
  // const client = generateClient(); // Removed from here

  // Load soldiers for the UIC
  const loadSoldiers = useCallback(async (currentUicID) => { // Pass uicID as an argument
    if (!currentUicID) return [];
    
    try {
      setLoading(true);
      
      const soldiersResponse = await client.graphql({
        query: `query GetSoldiersByUIC($uicID: ID!) {
          soldiersByUicID(uicID: $uicID) {
            items {
              id
              firstName
              lastName
              rank
              role
              hasAccount
            }
          }
        }`,
        variables: { uicID: currentUicID } // Use argument here
      });
      
      const soldiersList = soldiersResponse.data.soldiersByUicID.items;
      
      // Create a map for quick lookup
      const soldiersMapObj = {};
      soldiersList.forEach(soldier => {
        soldiersMapObj[soldier.id] = soldier;
      });
      
      setSoldiers(soldiersList);
      setSoldiersMap(soldiersMapObj);
      
      return soldiersList;
    } catch (error) {
      console.error('Error loading soldiers:', error);
      setError('Failed to load soldiers data');
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array makes this callback stable

  // Get formatted soldier name
  const getSoldierFullName = useCallback((soldierId) => {
    const soldier = soldiersMap[soldierId];
    if (!soldier) return 'Unknown';
    
    return `${soldier.rank} ${soldier.lastName}, ${soldier.firstName}`;
  }, [soldiersMap]);

  // Get soldier by ID
  const getSoldier = useCallback((soldierId) => {
    return soldiersMap[soldierId] || null;
  }, [soldiersMap]);

  // Load soldiers on mount
  useEffect(() => {
    if (uicID) {
      loadSoldiers(uicID); // Pass uicID here
    }
  }, [uicID, loadSoldiers]); // loadSoldiers is now stable

  return {
    loading,
    error,
    soldiers,
    soldiersMap,
    loadSoldiers, // Consumers can still call this if needed, passing uicID
    getSoldierFullName,
    getSoldier
  };
};

export default useSoldiers; 