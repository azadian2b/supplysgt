import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { persistCache, LocalForageWrapper } from 'apollo3-cache-persist';
import localForage from 'localforage';
import { fetchAuthSession } from 'aws-amplify/auth';
import awsconfig from '../aws-exports';

let clientPromise;
let persistor;

const cacheStorage = localForage.createInstance({
  name: 'supply-sgt',
  storeName: 'apollo-cache'
});

async function getAccessToken() {
  const session = await fetchAuthSession();
  return session?.tokens?.accessToken?.toString() || session?.tokens?.idToken?.toString();
}

export async function getApolloClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const cache = new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              listUICS: { keyArgs: ['filter'] },
              listUsers: { keyArgs: ['filter'] },
              listSoldiers: { keyArgs: ['filter'] },
              listEquipmentItems: { keyArgs: ['filter'] },
              listEquipmentGroups: { keyArgs: ['filter'] },
              listHandReceiptStatuses: { keyArgs: ['filter'] },
              listAccountabilitySessions: { keyArgs: ['filter'] },
              listAccountabilityItems: { keyArgs: ['filter'] },
              listAdditionalUICS: { keyArgs: ['filter'] }
            }
          }
        }
      });

      persistor = await persistCache({
        cache,
        storage: new LocalForageWrapper(cacheStorage),
        maxSize: 15 * 1024 * 1024
      });

      const authLink = setContext(async (_, { headers }) => {
        const token = await getAccessToken();
        return {
          headers: {
            ...headers,
            ...(token ? { Authorization: token } : {})
          }
        };
      });

      const errorLink = onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors) {
          graphQLErrors.forEach(error => {
            console.error('[AppSync GraphQL error]', error.message, error.path);
          });
        }
        if (networkError) {
          console.error('[AppSync network error]', networkError);
        }
      });

      const httpLink = new HttpLink({
        uri: awsconfig.aws_appsync_graphqlEndpoint
      });

      return new ApolloClient({
        link: ApolloLink.from([errorLink, authLink, httpLink]),
        cache,
        defaultOptions: {
          watchQuery: {
            fetchPolicy: 'cache-and-network',
            errorPolicy: 'all'
          },
          query: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all'
          },
          mutate: {
            errorPolicy: 'all'
          }
        }
      });
    })();
  }

  return clientPromise;
}

export async function resetApolloClientCache() {
  const client = await getApolloClient();
  await client.clearStore();
  if (persistor) {
    await persistor.purge();
  }
}

export { gql };
