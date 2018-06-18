/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import * as sqlops from 'sqlops';
import { CreateStepData } from '../data/createStepData';
import { AgentUtils } from '../agentUtils';

export class CreateStepDialog {

	// TODO: localize
	// Top level
	//
	private static readonly DialogTitle: string = 'New Job Step';
	private static readonly OkButtonText: string = 'OK';
	private static readonly CancelButtonText: string = 'Cancel';
	private static readonly GeneralTabText: string = 'General';
	private static readonly AdvancedTabText: string = 'Advanced';
	private static readonly OpenCommandText: string = 'Open...';
	private static readonly SelectAllCommandText: string = 'Select All';
	private static readonly CopyCommandText: string = 'Copy';
	private static readonly PasteCommandText: string = 'Paste';
	private static readonly ParseCommandText: string = 'Parse';
	private static readonly NextButtonText: string = 'Next';
	private static readonly PreviousButtonText: string = 'Previous';
	private static readonly SuccessAction: string = 'On success action';
	private static readonly FailureAction: string = 'On failure action';


	// Dropdown options
	private static readonly TSQLScript: string = 'Transact-SQL script (T-SQL)';
	private static readonly AgentServiceAccount: string = 'SQL Server Agent Service Account';
	private static readonly NextStep: string =  'Go to the next step';
	private static readonly QuitJobReportingSuccess: string =  'Quit the job reporting success';
	private static readonly QuitJobReportingFailure: string = 'Quit the job reporting failure';

	// UI Components
	//
	private dialog: sqlops.window.modelviewdialog.Dialog;
	private generalTab: sqlops.window.modelviewdialog.DialogTab;
	private advancedTab: sqlops.window.modelviewdialog.DialogTab;
	private nameTextBox: sqlops.InputBoxComponent;
	private typeDropdown: sqlops.DropDownComponent;
	private runAsDropdown: sqlops.DropDownComponent;
	private databaseDropdown: sqlops.DropDownComponent;
	private successActionDropdown: sqlops.DropDownComponent;
	private failureActionDropdown: sqlops.DropDownComponent;
	private commandTextBox: sqlops.InputBoxComponent;
	private openButton: sqlops.ButtonComponent;
	private selectAllButton: sqlops.ButtonComponent;
	private copyButton: sqlops.ButtonComponent;
	private pasteButton: sqlops.ButtonComponent;
	private parseButton: sqlops.ButtonComponent;
	private nextButton: sqlops.ButtonComponent;
	private previousButton: sqlops.ButtonComponent;
	private retryAttemptsBox: sqlops.InputBoxComponent;
	private retryIntervalBox: sqlops.InputBoxComponent;

	private flexButtonsModel;
	private overallContainer;

	private model: CreateStepData;
	private ownerUri: string;
	private jobId: string;

	constructor(ownerUri: string, jobId: string) {
		this.model = new CreateStepData(ownerUri);
		this.ownerUri = ownerUri;
		this.jobId = jobId;
	}

	private initializeUIComponents() {
		this.dialog = sqlops.window.modelviewdialog.createDialog(CreateStepDialog.DialogTitle);
		this.generalTab = sqlops.window.modelviewdialog.createTab(CreateStepDialog.GeneralTabText);
		this.advancedTab = sqlops.window.modelviewdialog.createTab(CreateStepDialog.AdvancedTabText);
		this.dialog.content = [this.generalTab, this.advancedTab];
		this.dialog.okButton.label = CreateStepDialog.OkButtonText;
		this.dialog.okButton.onClick(() => this.execute());
		this.dialog.cancelButton.label = CreateStepDialog.CancelButtonText;
	}

	private createCommands(view) {
		this.openButton = view.modelBuilder.button()
			.withProperties({
				label: CreateStepDialog.OpenCommandText
			}).component();
		this.selectAllButton = view.modelBuilder.button()
			.withProperties({
				label: CreateStepDialog.SelectAllCommandText
			}).component();
		this.copyButton = view.modelBuilder.button()
			.withProperties({
				label: CreateStepDialog.CopyCommandText
			}).component();
		this.pasteButton = view.modelBuilder.button()
			.withProperties({
				label: CreateStepDialog.PasteCommandText
			}).component();
		this.parseButton = view.modelBuilder.button()
			.withProperties({
				label: CreateStepDialog.ParseCommandText
			}).component();
		let text = view.modelBuilder.text()
			.withProperties({
				value: 'Command'
			}).component();
		this.flexButtonsModel = view.modelBuilder.flexContainer()
			.withLayout({
				flexFlow: 'column',
				alignItems: 'left',
				height: 300,
			}).withItems([
				text, this.openButton, this.selectAllButton , this.copyButton, this.pasteButton, this.parseButton]
			, { flex: '1 1 50%' }).component();
			this.commandTextBox = view.modelBuilder.inputBox()
			.withProperties({
				height: 300,
				width: 350,
				inputType: 'text'
			})
			.component();

		let commandContainer = view.modelBuilder.flexContainer()
			.withLayout({
				flexFlow: 'column',
				height: 300
			}).withItems([this.commandTextBox], {
				flex: '1 1 50%'
			}).component();

		this.overallContainer = view.modelBuilder.flexContainer().withLayout(
				{ flexFlow: 'row', justifyContent: 'center'}
			).withItems([this.flexButtonsModel, commandContainer]).component();
	}

	private createGeneralTab(databases: string[]) {
		this.generalTab.registerContent(async (view) => {
			this.nameTextBox = view.modelBuilder.inputBox()
				.withProperties({
				}).component();
			this.typeDropdown = view.modelBuilder.dropDown()
				.withProperties({
					value: CreateStepDialog.TSQLScript,
					values: [CreateStepDialog.TSQLScript]
				})
				.component();
			this.runAsDropdown = view.modelBuilder.dropDown()
				.withProperties({
					value: '',
					values: ['']
				})
				.component();
			this.typeDropdown.onValueChanged((type) => {
				if (type.selected !== CreateStepDialog.TSQLScript) {
					this.runAsDropdown.value = CreateStepDialog.AgentServiceAccount;
					this.runAsDropdown.values = [this.runAsDropdown.value];
				} else {
					this.runAsDropdown.value = '';
					this.runAsDropdown.values = [''];
				}
			});
			this.databaseDropdown = view.modelBuilder.dropDown()
			.withProperties({
				width: 320,
				value: databases[0],
				values: databases
			}).component();

			// create the commands section
			this.createCommands(view);

			this.nextButton = view.modelBuilder.button()
			.withProperties({
				label: CreateStepDialog.NextButtonText,
				enabled: false
			}).component();
			this.previousButton = view.modelBuilder.button()
			.withProperties({
				label: CreateStepDialog.PreviousButtonText,
				enabled: false
			}).component();

			let buttonContainer = view.modelBuilder.flexContainer()
			.withLayout({
				flexFlow: 'row',
				justifyContent: 'flex-end'
			}).withItems([this.nextButton, this.previousButton], {
				flex: '1 1 50%'
			}).component();

			let formModel = view.modelBuilder.formContainer()
				.withFormItems([{
					component: this.nameTextBox,
					title: 'Step name'
				}, {
					component: this.typeDropdown,
					title: 'Type'
				}, {
					component: this.runAsDropdown,
					title: 'Run as'
				}, {
					component: this.databaseDropdown,
					title: 'Database'
				}, {
					component: this.overallContainer,
					title: ''
				}, {
					component: buttonContainer,
					title: ''
				}], {
					horizontal: false,
					componentWidth: 420
				}).component();
			let formWrapper = view.modelBuilder.loadingComponent().withItem(formModel).component();
			formWrapper.loading = false;
			await view.initializeModel(formWrapper);
		});
	}

	private createRetryCounters(view) {
		this.retryAttemptsBox = view.modelBuilder.inputBox()
		.withProperties({
			inputType: 'number'
		})
		.component();
		this.retryIntervalBox = view.modelBuilder.inputBox()
			.withProperties({
				inputType: 'number'
			}).component();

		let retryAttemptsContainer = view.modelBuilder.formContainer()
			.withFormItems(
				[{
					component: this.retryAttemptsBox,
					title: 'Retry Attempts'
				}], {
					horizontal: false
				})
				.component();

		let retryIntervalContainer = view.modelBuilder.formContainer()
			.withFormItems(
				[{
					component: this.retryIntervalBox,
					title: 'Retry Attempts'
					}], {
					horizontal: false
				})
			.component();

		let retryFlexContainer = view.modelBuilder.flexContainer()
			.withLayout({
				flexFlow: 'row',
			}).withItems([retryAttemptsContainer, retryIntervalContainer]).component();
		return retryFlexContainer;
	}


	private createAdvancedTab() {
		this.advancedTab.registerContent(async (view) => {
			this.successActionDropdown = view.modelBuilder.dropDown()
				.withProperties({
					value: CreateStepDialog.NextStep,
					values: [CreateStepDialog.NextStep, CreateStepDialog.QuitJobReportingSuccess, CreateStepDialog.QuitJobReportingFailure]
				})
				.component();
			let retryFlexContainer = this.createRetryCounters(view);
			this.failureActionDropdown = view.modelBuilder.dropDown()
				.withProperties({
					value: CreateStepDialog.QuitJobReportingFailure,
					values: [CreateStepDialog.QuitJobReportingFailure, CreateStepDialog.NextStep, CreateStepDialog.QuitJobReportingSuccess]
				})
			.component();
			let optionsGroup = this.createTSQLOptions(view);
			let formModel = view.modelBuilder.formContainer()
				.withFormItems(
				[{
					component: this.successActionDropdown,
					title: CreateStepDialog.SuccessAction
				}, {
					component: retryFlexContainer,
					title: ''
				}, {
					component: this.failureActionDropdown,
					title: CreateStepDialog.FailureAction
				}, {
					component: optionsGroup,
					title: 'Options'
				}]).component();

			let formWrapper = view.modelBuilder.loadingComponent().withItem(formModel).component();
			formWrapper.loading = false;
			view.initializeModel(formWrapper);
		});
	}

	private createTSQLOptions(view) {
		let outputFileBox = view.modelBuilder.inputBox()
			.withProperties({
				width: 200,
				inputType: 'file'
			})
		.component();
		let outputFileForm = view.modelBuilder.formContainer()
			.withFormItems([{
					component: outputFileBox,
					title: 'Output file'
				}], { horizontal: true, componentWidth: 400}).component();
		let optionsGroup = view.modelBuilder.groupContainer()
			.withItems([outputFileForm]).component();
		return optionsGroup;
	}

	private async execute() {
		this.model.name = this.nameTextBox.value;
		this.model.type = this.typeDropdown.value;
		this.model.database = this.databaseDropdown.value;
		this.model.jobId = this.jobId;
		await this.model.save();
	}

	public async openNewStepDialog() {
		let databases = await AgentUtils.getDatabases(this.ownerUri);
		this.initializeUIComponents();
		this.createGeneralTab(databases);
		this.createAdvancedTab();
		sqlops.window.modelviewdialog.openDialog(this.dialog);
	}
}