const mapStateToProps = (state, { authorId }) => {
  const comments = getAllEntitiesOfType(state, { type: 'comment' });

  const authorComments = comments.filter(({ author }) => {
    return author.id === authorId;
  });

  return { authorComments };
};
