// Concrete Renderer for In-App Message Preview
import { InAppRenderOutput, RedirectTargetEnum } from '@novu/shared';
import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { RenderCommand } from './render-command';

@Injectable()
export class InAppOutputRendererUsecase {
  execute(renderCommand: RenderCommand): InAppRenderOutput {
    const inApp = InAppRenderOutputSchema.parse(renderCommand.controlValues);

    return {
      subject: inApp.subject,
      body: inApp.body,
      avatar: inApp.avatar,
      primaryAction: inApp.buttonSettings?.primaryAction
        ? {
            label: inApp.buttonSettings.primaryAction.label,
            redirect: {
              url: inApp.buttonSettings.primaryAction.redirect.url,
              target: inApp.buttonSettings.primaryAction.redirect.target as RedirectTargetEnum,
            },
          }
        : undefined,
      secondaryAction: inApp.buttonSettings?.secondaryAction
        ? {
            label: inApp.buttonSettings.secondaryAction?.label,
            redirect: {
              url: inApp.buttonSettings.secondaryAction?.redirect.url,
              target: inApp.buttonSettings.secondaryAction?.redirect.target as RedirectTargetEnum,
            },
          }
        : undefined,
      redirect: inApp.redirect
        ? {
            url: inApp.redirect.url,
            target: inApp.redirect.target as RedirectTargetEnum,
          }
        : undefined,
      data: inApp.data as Record<string, unknown>,
    };
  }
}
const RedirectTargetEnumSchema = z.enum(['_self', '_blank']); // Example enum, replace with your actual enum

const InAppRenderOutputSchema = z.object({
  subject: z.string().optional(),
  body: z.string(),
  avatar: z.string().optional(),
  buttonSettings: z
    .object({
      primaryAction: z
        .object({
          label: z.string(),
          redirect: z.object({
            url: z.string(),
            target: RedirectTargetEnumSchema.optional(), // Optional target
          }),
        })
        .optional(),
      secondaryAction: z
        .object({
          label: z.string(),
          redirect: z.object({
            url: z.string(),
            target: RedirectTargetEnumSchema.optional(), // Optional target
          }),
        })
        .optional(), // Optional secondary action
    })
    .optional(), // Optional button settings
  data: z.record(z.unknown()).optional(), // Optional data
  redirect: z
    .object({
      url: z.string(),
      target: RedirectTargetEnumSchema.optional(), // Optional target
    })
    .optional(),
});
