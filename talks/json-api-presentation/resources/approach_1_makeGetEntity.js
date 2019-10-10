// @flow
import { createSelectorCreator, defaultMemoize, createSelector } from 'reselect';
import type { MemorizedSelector } from 'reselect';
import { denormalizeEntity } from 'sj/api/dataFormatters';
import deepmerge from 'deepmerge';
import get from 'lodash/get';
import uniq from 'lodash/uniq';

// eslint-disable-next-line max-len
type MakeGetEntityType = <T: $Subtype<BaseEntityType>>(entityType: string) => MemorizedSelector<Object, { id: string }, T | null>

const buildKeysList = (a, b) => uniq([...Object.keys(a || {}), ...Object.keys(b || {})]);

/**
 * Два набора сущностей считаем одинаковыми,
 * если каждая пара сущностей из обоих наборов с одинаковым type и id - это ссылки на один и тот же объект
 */
const isEntityEqual = (a, b) => {
  console.log('comparing', a, b);

  return !buildKeysList(a, b).find((type) => {
    const changedEntityId = buildKeysList(a[type], b[type]).find((id) => get(a, [type, id]) !== get(b, [type, id]));
    return typeof changedEntityId !== 'undefined';
  });
};

const entityEqualityCheck = (a, b) => {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return isEntityEqual(a, b);
};

/**
 * Функция - замена createSelector из reselect
 * Фабрика селекторов, кеш которых не пробивают изменения сущностей, от которых не зависит селектор
 */
export const createEntitySelector = createSelectorCreator(defaultMemoize, entityEqualityCheck);

const emptyObject = {};
/**
 * Создаёт селектор,
 * который по типу сущности и её id получает саму сущность и все сущности по её связям (рекурсивно).
 * Кольцевые связи поддерживаются.
 * Возвращает часть стейта, необходимую для денормализации сущности
 */
export const makeEntitiesSelector = (entityType: string) => createSelector(
  [
    ({ entities }) => entities,
    () => entityType,
    (state, { id }) => id,
  ],
  function makeEntities(entities, type, id, result = emptyObject) {
    if (!id || !entities || !entities[type]) {
      return result;
    }

    const entity = entities[type][id];
    if (!entity) {
      return result;
    }

    const relationships = entity.relationships || {};

    return Object.keys(relationships).reduce((acc, key) => {
      const { data: relation } = relationships[key];
      if (!relation) {
        return acc;
      }
      if (Array.isArray(relation)) {
        return relation.reduce((relsAcc, rel) => {
          if (get(relsAcc, [rel.type, rel.id])) {
            return relsAcc;
          }
          return makeEntities(entities, rel.type, rel.id, relsAcc);
        }, acc);
      }
      if (get(acc, [relation.type, relation.id])) {
        return acc;
      }
      return makeEntities(entities, relation.type, relation.id, acc);
    }, deepmerge(result, { [type]: { [id]: entity } }));
  },
);

const makeGetEntity: MakeGetEntityType = (entityType) => createEntitySelector(
  [
    makeEntitiesSelector(entityType),
    (_, { id }) => id,
  ],
  (entities, id) => {
    if (!id) {
      return null;
    }
    return denormalizeEntity(entities, entityType, id) || null;
  },
);

export default makeGetEntity;
