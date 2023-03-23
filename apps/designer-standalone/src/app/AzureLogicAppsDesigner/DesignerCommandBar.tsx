import { FontIcon, mergeStyles, mergeStyleSets } from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react/lib/CommandBar';
import { CommandBar } from '@fluentui/react/lib/CommandBar';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import type { RootState, Workflow } from '@microsoft/logic-apps-designer';
import {
  store as DesignerStore,
  serializeBJSWorkflow,
  updateCallbackUrl,
  switchToWorkflowParameters,
} from '@microsoft/logic-apps-designer';
import { useMutation } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

const iconClass = mergeStyles({
  fontSize: 16,
  height: 16,
  width: 16,
});

const classNames = mergeStyleSets({
  azureBlue: [{ color: 'rgb(0, 120, 212)' }, iconClass],
});

export const DesignerCommandBar = ({
  discard,
  saveWorkflow,
  isDarkMode,
}: {
  id: string;
  location: string;
  isReadOnly: boolean;
  discard: () => unknown;
  saveWorkflow: (workflow: Workflow) => Promise<void>;
  isDarkMode: boolean;
  isConsumption?: boolean;
}) => {
  const dispatch = useDispatch();
  const { isLoading: isSaving, mutate: saveWorkflowMutate } = useMutation(async () => {
    const designerState = DesignerStore.getState();
    const serializedWorkflow = await serializeBJSWorkflow(designerState, {
      skipValidation: true,
      ignoreNonCriticalErrors: true,
    });
    await saveWorkflow(serializedWorkflow);

    updateCallbackUrl(designerState, DesignerStore.dispatch);
  });

  const allOperationErrors = useSelector((state: RootState) => {
    return (Object.entries(state.operations.inputParameters) ?? []).filter(([_id, nodeInputs]) =>
      Object.values(nodeInputs.parameterGroups).some((parameterGroup) =>
        parameterGroup.parameters.some((parameter) => (parameter?.validationErrors?.length ?? 0) > 0)
      )
    );
  });

  const items: ICommandBarItemProps[] = [
    {
      key: 'save',
      text: 'Save',
      secondaryText: 'Hello',
      disabled: isSaving || allOperationErrors.length > 0,
      onRenderIcon: () => {
        return isSaving ? (
          <Spinner size={SpinnerSize.small} />
        ) : (
          <FontIcon aria-label="Save" iconName="Save" className={classNames.azureBlue} />
        );
      },
      onClick: () => {
        saveWorkflowMutate();
      },
    },
    {
      key: 'discard',
      disabled: isSaving,
      text: 'Discard',
      iconProps: { iconName: 'Clear' },
      onClick: () => {
        discard();
      },
    },
    {
      key: 'parameters',
      text: 'Parameters',
      iconProps: { iconName: 'Parameter' },
      onClick: () => dispatch(switchToWorkflowParameters()),
    },
    {
      key: 'fileABug',
      text: 'File a bug',
      iconProps: { iconName: 'Bug' },
      onClick: () => {
        window.open('https://github.com/Azure/logic_apps_designer/issues/new', '_blank');
      },
    },
  ];
  return (
    <CommandBar
      items={items}
      ariaLabel="Use left and right arrow keys to navigate between commands"
      styles={{
        root: { borderBottom: `1px solid ${isDarkMode ? '#333333' : '#d6d6d6'}` },
      }}
    />
  );
};