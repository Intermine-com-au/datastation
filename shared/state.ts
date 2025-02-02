import * as uuid from 'uuid';

import { mergeDeep } from './merge';

export type ConnectorInfoType = 'sql' | 'http';

export class ConnectorInfo {
  name: string;
  type: ConnectorInfoType;
  id: string;

  constructor(type?: ConnectorInfoType, name?: string) {
    this.name = name || 'Untitled Connector';
    this.type = type || 'sql';
    this.id = uuid.v4();
  }
}

export type HTTPConnectorInfoMethod =
  | 'GET'
  | 'HEAD'
  | 'PUT'
  | 'POST'
  | 'DELETE';

export class HTTPConnectorInfo extends ConnectorInfo {
  http: {
    headers: Array<{ value: string; name: string }>;
    url: string;
    method: HTTPConnectorInfoMethod;
  };

  constructor(
    name?: string,
    url?: string,
    headers: Array<{ value: string; name: string }> = [],
    method?: HTTPConnectorInfoMethod
  ) {
    super('http', name);
    this.http = {
      headers,
      url: url || '',
      method: method || 'GET',
    };
  }
}

export type SQLConnectorInfoType = 'postgres' | 'in-memory';

export class SQLConnectorInfo extends ConnectorInfo {
  sql: {
    type: SQLConnectorInfoType;
    database: string;
    username: string;
    password: string;
    address: string;
  };

  constructor(
    name?: string,
    type?: SQLConnectorInfoType,
    database?: string,
    username?: string,
    password?: string,
    address?: string
  ) {
    super('sql', name);
    this.sql = {
      type: type || 'in-memory',
      database: database || '',
      username: username || '',
      password: password || '',
      address: address || '',
    };
  }
}

export type PanelInfoType =
  | 'table'
  | 'http'
  | 'graph'
  | 'program'
  | 'literal'
  | 'sql';

export class PanelInfo {
  content: string;
  type: PanelInfoType;
  name: string;
  id: string;

  constructor(type: PanelInfoType, name?: string, content?: string) {
    this.content = content || '';
    this.type = type;
    this.name = name || '';
    this.id = uuid.v4();
  }
}

export type ProgramPanelInfoType = 'javascript' | 'python';

export class ProgramPanelInfo extends PanelInfo {
  program: {
    type: ProgramPanelInfoType;
  };

  constructor(name?: string, type?: ProgramPanelInfoType, content?: string) {
    super('program', name, content);
    this.program = {
      type: type || 'javascript',
    };
  }
}

export interface GraphY {
  field: string;
  label: string;
}

export type GraphPanelInfoType = 'bar';

export class GraphPanelInfo extends PanelInfo {
  graph: {
    panelSource: number;
    y: GraphY;
    x: string;
    type: GraphPanelInfoType;
  };

  constructor(
    name?: string,
    panelSource?: number,
    y?: GraphY,
    x?: string,
    type?: GraphPanelInfoType,
    content?: string
  ) {
    super('graph', name, content);
    this.graph = {
      panelSource: panelSource || 0,
      x: x || '',
      y: y || { field: '', label: '' },
      type: type || 'bar',
    };
  }
}

export class SQLPanelInfo extends PanelInfo {
  sql: SQLConnectorInfo;

  constructor(name?: string, sql?: SQLConnectorInfo, content?: string) {
    super('sql', name, content);
    this.sql = new SQLConnectorInfo();
  }
}

export type HTTPPanelInfoType = 'csv' | 'json';

export class HTTPPanelInfo extends PanelInfo {
  http: HTTPConnectorInfo;

  constructor(name?: string, http?: HTTPConnectorInfo, content?: string) {
    super('http', name, content);
    this.http = http || new HTTPConnectorInfo();
  }
}

export interface TableColumn {
  label: string;
  field: string;
}

export class TablePanelInfo extends PanelInfo {
  table: {
    columns: Array<TableColumn>;
    panelSource: number;
  };

  constructor(
    name?: string,
    columns: Array<TableColumn> = [],
    panelSource: number = 0,
    content?: string
  ) {
    super('table', name, content);
    this.table = {
      columns,
      panelSource,
    };
  }
}

export type LiteralPanelInfoType = 'csv' | 'json';

export class LiteralPanelInfo extends PanelInfo {
  literal: {
    type: LiteralPanelInfoType;
  };

  constructor(name?: string, type?: LiteralPanelInfoType, content?: string) {
    super('literal', name, content);
    this.literal = {
      type: type || 'csv',
    };
  }
}

export class ProjectPage {
  panels: Array<PanelInfo>;
  name: string;
  id: string;

  constructor(name?: string, panels?: Array<PanelInfo>) {
    this.name = name || '';
    this.panels = panels || [];
    this.id = uuid.v4();
  }
}

export class ProjectState {
  pages: Array<ProjectPage>;
  projectName: string;
  connectors: Array<ConnectorInfo>;
  id: string;

  constructor(
    projectName?: string,
    pages?: Array<ProjectPage>,
    connectors?: Array<ConnectorInfo>
  ) {
    this.pages = pages || [];
    this.projectName = projectName || '';
    this.connectors = connectors || [];
    this.id = uuid.v4();
  }
}

export const DEFAULT_PROJECT: ProjectState = new ProjectState(
  'Example project',
  [
    new ProjectPage('CSV Discovery Example', [
      new LiteralPanelInfo(
        'Raw CSV Text',
        'csv',
        'name,age\nMorgan,12\nJames,17'
      ),
      new SQLPanelInfo(
        'Transform with SQL',
        new SQLConnectorInfo('In Memory', 'in-memory'),
        'SELECT name, age+5 AS age FROM DM_getPanel(0);'
      ),
      (() => {
        const panel = new GraphPanelInfo('Display');
        panel.graph.y = { field: 'age', label: 'Age' };
        panel.graph.x = 'name';
        panel.graph.panelSource = 1;
        return panel;
      })(),
    ]),
  ]
);

// The point of this is to make sure that (new) defaults get set on
// existing data.
//
export function rawStateToObjects(raw: ProjectState): ProjectState {
  // Make a deep copy
  const object = mergeDeep(new ProjectState(), JSON.parse(JSON.stringify(raw)));

  object.pages.forEach((_: ProjectPage, pageI: number) => {
    const page = (object.pages[pageI] = mergeDeep(
      new ProjectPage(),
      object.pages[pageI]
    ));

    page.panels.forEach((panel: PanelInfo, i: number) => {
      switch (panel.type) {
        case 'table':
          page.panels[i] = mergeDeep(new TablePanelInfo(), panel);
          break;
        case 'http':
          page.panels[i] = mergeDeep(new HTTPPanelInfo(), panel);
          break;
        case 'graph':
          page.panels[i] = mergeDeep(new GraphPanelInfo(), panel);
          break;
        case 'program':
          page.panels[i] = mergeDeep(new ProgramPanelInfo(), panel);
          break;
        case 'literal':
          page.panels[i] = mergeDeep(new LiteralPanelInfo(), panel);
          break;
        case 'sql':
          page.panels[i] = mergeDeep(new SQLPanelInfo(), panel);
          break;
        default:
          console.error(`Unknown panel type: ${panel.type}`);
      }
    });
  });

  object.connectors.forEach((c: ConnectorInfo, i: number) => {
    switch (c.type) {
      case 'sql':
        object.connectors[i] = mergeDeep(new SQLConnectorInfo(), c);
        break;
      case 'http':
        object.connectors[i] = mergeDeep(new HTTPConnectorInfo(), c);
        break;
      default:
        console.error(`Unknown connector type: ${c.type}`);
    }
  });

  return object;
}
