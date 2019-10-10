const getEntityById = createSelector(
  ({ entities }) => entities,
  (_, { type }) => type,
  (_, { id }) => id,
  (entities, type, id) => denormalizeEntity(entities, type, id),
);
