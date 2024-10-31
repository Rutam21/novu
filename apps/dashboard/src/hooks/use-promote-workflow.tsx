import { getV2, NovuApiError } from '@/api/api.client';
import { promoteWorkflow } from '@/api/workflows';
import { Button } from '@/components/primitives/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/primitives/dialog';
import { ToastClose } from '@/components/primitives/sonner';
import { ToastIcon } from '@/components/primitives/sonner';
import { showToast } from '@/components/primitives/sonner-helpers';
import { useEnvironment } from '@/context/environment/hooks';
import { WorkflowListResponseDto, WorkflowOriginEnum, WorkflowResponseDto, WorkflowStatusEnum } from '@novu/shared';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { RiAlertFill, RiArrowRightSLine } from 'react-icons/ri';
import { toast } from 'sonner';

const PRODUCTION_ENVIRONMENT = 'Production' as const;

export function usePromoteWorkflow(workflow: WorkflowListResponseDto) {
  const { environments, switchEnvironment, currentEnvironment } = useEnvironment();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  let loadingToast: string | number | undefined = undefined;

  const isPromotable = useMemo(
    () =>
      workflow.origin === WorkflowOriginEnum.NOVU_CLOUD &&
      workflow.status !== WorkflowStatusEnum.ERROR &&
      currentEnvironment?.name !== PRODUCTION_ENVIRONMENT,
    [workflow.origin, workflow.status, currentEnvironment?.name]
  );

  const getProductionEnvironmentId = useCallback(() => {
    return environments?.find((environment) => environment.name === PRODUCTION_ENVIRONMENT)?._id || '';
  }, [environments]);

  const getTooltipContent = () => {
    if (workflow.origin === WorkflowOriginEnum.EXTERNAL) {
      return 'External workflows cannot be promoted to Production using dashboard.';
    }

    if (workflow.origin === WorkflowOriginEnum.NOVU_CLOUD_V1) {
      return 'V1 workflows cannot be promoted to Production using dashboard. Please visit the legacy portal.';
    }

    if (workflow.status === WorkflowStatusEnum.ERROR) {
      return 'This workflow has errors and cannot be promoted to Production. Please fix the errors first.';
    }
  };

  const safePromote = async () => {
    try {
      if (await isWorkflowInProduction()) {
        setShowConfirmModal(true);

        return;
      }
    } catch (error) {
      if (error instanceof NovuApiError && error.status === 404) {
        await promoteWorkflowMutation();

        return;
      }

      toast.error('Failed to promote workflow', {
        description: error instanceof Error ? error.message : 'There was an error promoting the workflow.',
      });
    }
  };

  const isWorkflowInProduction = async () => {
    const { data: workflowInProd } = await getV2<{ data: WorkflowResponseDto }>(
      `/workflows/${workflow.workflowId}?environmentId=${getProductionEnvironmentId()}`
    );

    return !!workflowInProd;
  };

  const onPromoteSuccess = () => {
    toast.dismiss(loadingToast);
    setIsLoading(false);

    return showToast({
      variant: 'lg',
      className: 'gap-3',
      children: ({ close }) => (
        <>
          <ToastIcon variant="default" />
          <div className="flex flex-1 flex-col items-start gap-2.5">
            <div className="flex flex-col items-start justify-center gap-1 self-stretch">
              <div className="text-foreground-950 text-sm font-medium">Workflow promoted to Production</div>
              <div className="text-foreground-600 text-sm">
                Workflow '{workflow.name}' has been successfully promoted to production.
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 self-stretch">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive gap-1"
                onClick={() => switchEnvironment(getProductionEnvironmentId())}
              >
                Switch to production
                <RiArrowRightSLine />
              </Button>
            </div>
          </div>
          <ToastClose onClick={close} />
        </>
      ),
      options: {
        position: 'bottom-right',
      },
    });
  };

  const onPromoteError = (error: unknown) => {
    toast.dismiss(loadingToast);
    setIsLoading(false);

    toast.error('Failed to promote workflow', {
      description: error instanceof Error ? error.message : 'There was an error promoting the workflow.',
    });
  };

  const { mutateAsync: promoteWorkflowMutation } = useMutation({
    mutationFn: async () =>
      promoteWorkflow(workflow._id, { targetEnvironmentId: getProductionEnvironmentId() }).then((res) => res.data),
    onMutate: () => {
      setIsLoading(true);
      loadingToast = toast.loading('Promoting workflow...');
    },
    onSuccess: onPromoteSuccess,
    onError: onPromoteError,
  });

  const ConfirmationModal = () => {
    async function onConfirm() {
      setShowConfirmModal(false);
      await promoteWorkflowMutation();
    }

    return (
      <Dialog modal open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent className="sm:max-w-[440px]">
            <div className="flex items-start gap-4 self-stretch">
              <div className="bg-warning/10 flex items-center justify-center gap-2 rounded-[10px] p-2">
                <RiAlertFill className="text-warning size-6" />
              </div>
              <div className="flex flex-1 flex-col items-start gap-1">
                <DialogTitle className="text-md font-medium">Promote workflow to Production</DialogTitle>
                <DialogDescription className="text-foreground-600">
                  Workflow already exists in Production. Proceeding will overwrite the existing workflow.
                </DialogDescription>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild aria-label="Close">
                <Button type="button" size="sm" variant="outline" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild aria-label="Close">
                <Button type="button" size="sm" variant="primary" onClick={onConfirm}>
                  Proceed
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    );
  };

  return {
    safePromote,
    promote: promoteWorkflowMutation,
    isPromotable,
    isLoading,
    tooltipContent: getTooltipContent(),
    ConfirmationModal,
  };
}
