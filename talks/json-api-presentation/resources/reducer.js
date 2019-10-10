export function entities(state = {}, action) {
  const { id, type, ...entity } = action.payload;

  switch (action.type) {
    case 'ADD_ENTITY': return {
      ...state,
      [type]: {
        ...state[type],
        [id]: { id, type, ...entity },
      },
    }
  }
}
