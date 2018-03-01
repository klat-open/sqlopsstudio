/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { SqlExtHostContext, SqlMainContext, ExtHostObjectExplorerShape, MainThreadObjectExplorerShape } from 'sql/workbench/api/node/sqlExtHost.protocol';
import * as sqlops from 'sqlops';
import * as vscode from 'vscode';
import { IExtHostContext } from 'vs/workbench/api/node/extHost.protocol';
import { extHostNamedCustomer } from 'vs/workbench/api/electron-browser/extHostCustomers';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IObjectExplorerService, NodeInfoWithConnection } from 'sql/parts/registeredServer/common/objectExplorerService';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import * as TaskUtilities from 'sql/workbench/common/taskUtilities';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { dispose, IDisposable } from 'vs/base/common/lifecycle';

@extHostNamedCustomer(SqlMainContext.MainThreadObjectExplorer)
export class MainThreadObjectExplorer implements MainThreadObjectExplorerShape {

	private _proxy: ExtHostObjectExplorerShape;
	private _toDispose: IDisposable[];

	constructor(
		extHostContext: IExtHostContext,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IObjectExplorerService private _objectExplorerService: IObjectExplorerService,
		@IWorkbenchEditorService private _workbenchEditorService: IWorkbenchEditorService
	) {
		if (extHostContext) {
			this._proxy = extHostContext.get(SqlExtHostContext.ExtHostObjectExplorer);
		}
		this._toDispose = [];
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	public $getNode(connectionId: string, nodePath?: string): Thenable<sqlops.NodeInfo> {
		return Promise.resolve(this._objectExplorerService.findNodeInfo(connectionId, nodePath));
	}

	public $getActiveConnectionNodes(): Thenable<NodeInfoWithConnection[]> {
		return Promise.resolve(this._objectExplorerService.getActiveConnectionNodes());
	}

	public $setExpandedState(connectionId: string, nodePath: string, expandedState: vscode.TreeItemCollapsibleState): Thenable<void> {
		return this._objectExplorerService.setNodeExpandedState(connectionId, nodePath, expandedState);
	}

	public $setSelected(connectionId: string, nodePath: string, selected: boolean, clearOtherSelections: boolean = undefined): Thenable<void> {
		return this._objectExplorerService.setNodeSelected(connectionId, nodePath, selected, clearOtherSelections);
	}

	public $getChildren(connectionId: string, nodePath: string): Thenable<sqlops.NodeInfo[]> {
		return this._objectExplorerService.getChildren(connectionId, nodePath);
	}

	public $isExpanded(connectionId: string, nodePath: string): Thenable<boolean> {
		return Promise.resolve(this._objectExplorerService.isExpanded(connectionId, nodePath));
	}
}
