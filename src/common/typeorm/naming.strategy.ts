import { DefaultNamingStrategy } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';
import * as pluralize from 'pluralize';

import * as dotenv from 'dotenv';
dotenv.config({
  path: `.env.dev`,
});

const { TABLE_PREFIX } = process.env;
export class NamingStrategy extends DefaultNamingStrategy {
  // eslint-disable-next-line class-methods-use-this
  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName || pluralize(snakeCase(TABLE_PREFIX ? `${TABLE_PREFIX}_${targetName}` : targetName));
  }

  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return snakeCase(embeddedPrefixes.join('_')) + (customName || snakeCase(propertyName));
  }
}
