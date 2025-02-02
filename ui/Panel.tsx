import * as React from 'react';

import {
  ProjectPage,
  PanelInfo,
  GraphPanelInfo,
  HTTPPanelInfo,
  SQLPanelInfo,
  ProgramPanelInfo,
  TablePanelInfo,
  LiteralPanelInfo,
} from './../shared/state';

import { PanelResult } from './ProjectStore';
import { GraphPanel, GraphPanelDetails } from './GraphPanel';
import { evalHTTPPanel, HTTPPanelDetails } from './HTTPPanel';
import { evalProgramPanel, ProgramPanelDetails } from './ProgramPanel';
import { TablePanel, TablePanelDetails } from './TablePanel';
import { evalLiteralPanel, LiteralPanelDetails } from './LiteralPanel';
import { evalSQLPanel, SQLPanelDetails } from './SQLPanel';
import { Button } from './component-library/Button';
import { Input } from './component-library/Input';
import { Select } from './component-library/Select';
import { Textarea } from './component-library/Textarea';

export const PANEL_TYPE_ICON = {
  literal: 'format_quote',
  program: 'code',
  table: 'table_chart',
  graph: 'bar_chart',
  http: 'http',
  sql: 'table_rows',
};

export async function evalPanel(
  page: ProjectPage,
  panelId: number,
  panelResults: Array<PanelResult>
) {
  const panel = page.panels[panelId];
  switch (panel.type) {
    case 'program':
      return await evalProgramPanel(panel as ProgramPanelInfo, panelResults);
    case 'literal':
      return evalLiteralPanel(panel as LiteralPanelInfo);
    case 'sql':
      return evalSQLPanel(panel as SQLPanelInfo, panelResults);
    case 'graph':
      return (panelResults[(panel as GraphPanelInfo).graph.panelSource] || {})
        .value;
    case 'table':
      return (panelResults[(panel as TablePanelInfo).table.panelSource] || {})
        .value;
    case 'http':
      return await evalHTTPPanel(panel as HTTPPanelInfo);
  }
}

function previewValueAsString(value: any) {
  return JSON.stringify(value, null, 2);
}

export function Panel({
  panel,
  updatePanel,
  panelResults,
  reevalPanel,
  panelIndex,
  removePanel,
  movePanel,
  panelCount,
}: {
  panel: PanelInfo;
  updatePanel: (d: PanelInfo) => void;
  panelResults: Array<PanelResult>;
  reevalPanel: (i: number) => void;
  panelIndex: number;
  removePanel: (i: number) => void;
  movePanel: (from: number, to: number) => void;
  panelCount: number;
}) {
  const [details, setDetails] = React.useState(
    panel.type === 'table' || panel.type === 'graph' || panel.type === 'http'
  );
  const [hidden, setHidden] = React.useState(false);

  let body = null;
  const exception =
    panelResults[panelIndex] && panelResults[panelIndex].exception;
  if (!exception && panel.type === 'table') {
    body = (
      <TablePanel panel={panel as TablePanelInfo} panelResults={panelResults} />
    );
  } else if (!exception && panel.type === 'graph') {
    body = (
      <GraphPanel
        panel={panel as GraphPanelInfo}
        data={panelResults[panelIndex]}
      />
    );
  }

  const [preview, setPreview] = React.useState('');
  const results = panelResults[panelIndex];
  React.useEffect(() => {
    if (
      panel.type === 'http' ||
      panel.type === 'sql' ||
      panel.type === 'program'
    ) {
      if (results && !results.exception) {
        const resultsLines = previewValueAsString(results.value).split('\n');
        setPreview(resultsLines.slice(0, 50).join('\n'));
      }
    }
  }, [results?.value, results?.exception]);

  const [previewVisible, setPreviewVisible] = React.useState(false);

  return (
    <div className={`panel ${hidden ? 'panel--hidden' : ''}`}>
      <div className="panel-head">
        <div className="panel-header vertical-align-center">
          <Button
            icon
            disabled={panelIndex === 0}
            onClick={() => {
              movePanel(panelIndex, panelIndex - 1);
            }}
          >
            keyboard_arrow_up
          </Button>
          <Button
            icon
            disabled={panelIndex === panelCount - 1}
            onClick={() => {
              movePanel(panelIndex, panelIndex + 1);
            }}
          >
            keyboard_arrow_down
          </Button>
          <span className="material-icons">{PANEL_TYPE_ICON[panel.type]}</span>
          <Input
            className="panel-name"
            onChange={(value: string) => {
              panel.name = value;
              updatePanel(panel);
            }}
            value={panel.name}
          />
          {panel.type !== 'table' &&
            panel.type !== 'graph' &&
            panel.type !== 'http' && (
              <Button icon onClick={() => setDetails(!details)}>
                {details ? 'unfold_less' : 'unfold_more'}
              </Button>
            )}
          <span className="panel-controls vertical-align-center flex-right">
            <span className="last-run">
              {(panelResults[panelIndex] || {}).lastRun
                ? 'Last run ' + panelResults[panelIndex].lastRun
                : 'Not run'}
            </span>
            <Button icon onClick={() => reevalPanel(panelIndex)}>
              play_arrow
            </Button>
            <Button icon onClick={() => setHidden(!hidden)}>
              {hidden ? 'visibility' : 'visibility_off'}
            </Button>
            <Button icon onClick={() => removePanel(panelIndex)}>
              delete
            </Button>
          </span>
        </div>
        {details && (
          <div className="panel-details">
            <div>
              <Select
                label="Type"
                value={panel.type}
                onChange={(value: string) => {
                  let newPanel;
                  switch (value) {
                    case 'sql':
                      newPanel = new SQLPanelInfo(panel.name);
                      break;
                    case 'literal':
                      newPanel = new LiteralPanelInfo(panel.name);
                      break;
                    case 'program':
                      newPanel = new ProgramPanelInfo(panel.name);
                      break;
                    case 'table':
                      newPanel = new TablePanelInfo(panel.name);
                      break;
                    case 'graph':
                      newPanel = new GraphPanelInfo(panel.name);
                      break;
                    case 'http':
                      newPanel = new HTTPPanelInfo(panel.name);
                      break;
                    default:
                      throw new Error(`Invalid panel type: ${value}`);
                  }

                  newPanel.content = panel.content;
                  updatePanel(newPanel);
                }}
              >
                <option value="sql">SQL</option>
                <option value="program">Code</option>
                <option value="http">HTTP Request</option>
                <option value="table">Table</option>
                <option value="graph">Graph</option>
                <option value="literal">Literal</option>
              </Select>
            </div>
            {panel.type === 'table' && (
              <TablePanelDetails
                panel={panel as TablePanelInfo}
                updatePanel={updatePanel}
                panelCount={panelCount}
              />
            )}
            {panel.type === 'sql' && (
              <SQLPanelDetails
                panel={panel as SQLPanelInfo}
                updatePanel={updatePanel}
              />
            )}
            {panel.type === 'literal' && (
              <LiteralPanelDetails
                panel={panel as LiteralPanelInfo}
                updatePanel={updatePanel}
              />
            )}
            {panel.type === 'http' && (
              <HTTPPanelDetails
                panel={panel as HTTPPanelInfo}
                updatePanel={updatePanel}
              />
            )}
            {panel.type === 'graph' && (
              <GraphPanelDetails
                panel={panel as GraphPanelInfo}
                updatePanel={updatePanel}
                panelCount={panelCount}
              />
            )}
            {panel.type === 'program' && (
              <ProgramPanelDetails
                panel={panel as ProgramPanelInfo}
                updatePanel={updatePanel}
                panelIndex={panelIndex}
              />
            )}
          </div>
        )}
      </div>
      {!hidden && (
        <div className="panel-body">
          {body ? (
            body
          ) : (
            <Textarea
              spellCheck="false"
              value={panel.content}
              onChange={(value: string) => {
                panel.content = value;
                updatePanel(panel);
              }}
              className="editor"
            />
          )}
          {exception && (
            <div className="error">
              <div>Error evaluating panel:</div>
              <pre>
                <code>{exception}</code>
              </pre>
            </div>
          )}
          {panel.type === 'program' && (
            <div className="alert alert-info">
              Use builtin functions, <code>DM_setPanel($some_array_data)</code>{' '}
              and <code>DM_getPanel($panel_number)</code>, to interact with
              other panels. For example:{' '}
              <code>
                const passthrough = DM_getPanel(0); DM_setPanel(passthrough);
              </code>
              .
            </div>
          )}
          {panel.type === 'sql' && (
            <div className="alert alert-info">
              Use builtin <code>DM_getPanel($panel_number)</code> to interact
              with other panels as tables. For example:{' '}
              <code>SELECT * FROM DM_getPanel(0);</code>.
            </div>
          )}
          {preview && (
            <div
              className="panel-preview"
              onMouseEnter={() => setPreviewVisible(true)}
              onMouseLeave={() => setPreviewVisible(false)}
            >
              {previewVisible && (
                <pre className="panel-preview-results">
                  <code>{preview}</code>
                </pre>
              )}
              {!previewVisible && (
                <div className="panel-preview-message">Preview results</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
