'use client';

import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// HTTP Link
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql',
});

// Auth Link untuk menyertakan token pada request HTTP
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
});

// WebSocket Link untuk Subscriptions
const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(createClient({
      url: (process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql').replace('http', 'ws'),
      connectionParams: () => ({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      }),
    }))
  : null;

// Split link untuk mengarahkan traffic
// (Queries/Mutations ke HTTP, Subscriptions ke WebSocket)
const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      authLink.concat(httpLink),
    )
  : authLink.concat(httpLink);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}