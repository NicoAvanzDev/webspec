/**
 * Zod schemas for every WebSpec step command.
 * Organised into logical groups matching the spec format.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Selector schema (inline fields)
// ---------------------------------------------------------------------------

/** Raw selector object (no at-least-one refinement) — safe to `.extend()`. */
export const SelectorObjectSchema = z.object({
  text: z.string().optional(),
  role: z.string().optional(),
  name: z.string().optional(),
  testid: z.string().optional(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  css: z.string().optional(),
  xpath: z.string().optional(),
  exact: z.boolean().optional(),
  nth: z.number().int().nonnegative().optional(),
});

const selectorAtLeastOne = (s: z.infer<typeof SelectorObjectSchema>) =>
  s.text !== undefined ||
  s.role !== undefined ||
  s.testid !== undefined ||
  s.label !== undefined ||
  s.placeholder !== undefined ||
  s.css !== undefined ||
  s.xpath !== undefined;

const selectorAtLeastOneMsg = {
  message:
    'At least one selector field is required: text, role, testid, label, placeholder, css, or xpath',
};

export const SelectorSchema = SelectorObjectSchema.refine(
  selectorAtLeastOne,
  selectorAtLeastOneMsg,
);

/** Accepts either a plain string (text shorthand) or a full selector object. */
export const SelectorOrStringSchema = z.union([z.string().min(1), SelectorSchema]);

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export const NavigateParamsSchema = z.object({
  url: z.string().min(1),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle', 'commit']).optional(),
  timeout: z.number().int().positive().optional(),
});

export const NavigateStepSchema = z.object({
  navigate: z.union([z.string().min(1), NavigateParamsSchema]),
}).strict();

export const ReloadStepSchema = z.object({
  reload: z
    .object({
      waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle', 'commit']).optional(),
      timeout: z.number().int().positive().optional(),
    })
    .nullable()
    .optional(),
}).strict();

export const GoBackStepSchema = z.object({
  goBack: z.object({ timeout: z.number().int().positive().optional() }).nullable().optional(),
}).strict();

export const GoForwardStepSchema = z.object({
  goForward: z.object({ timeout: z.number().int().positive().optional() }).nullable().optional(),
}).strict();

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

export const ClickStepSchema = z.object({
  click: SelectorOrStringSchema,
}).strict();

export const DoubleClickStepSchema = z.object({
  doubleClick: SelectorOrStringSchema,
}).strict();

export const HoverStepSchema = z.object({
  hover: SelectorOrStringSchema,
}).strict();

export const FocusStepSchema = z.object({
  focus: SelectorOrStringSchema,
}).strict();

export const FillParamsSchema = SelectorObjectSchema.extend({
  value: z.string(),
  clear: z.boolean().optional(),
}).refine(selectorAtLeastOne, selectorAtLeastOneMsg);

export const FillStepSchema = z.object({
  fill: FillParamsSchema,
}).strict();

export const TypeParamsSchema = SelectorObjectSchema.extend({
  value: z.string(),
  delay: z.number().int().nonnegative().optional(),
}).refine(selectorAtLeastOne, selectorAtLeastOneMsg);

export const TypeStepSchema = z.object({
  type: TypeParamsSchema,
}).strict();

export const SelectParamsSchema = SelectorObjectSchema.extend({
  value: z.union([z.string(), z.array(z.string())]),
}).refine(selectorAtLeastOne, selectorAtLeastOneMsg);

export const SelectStepSchema = z.object({
  select: SelectParamsSchema,
}).strict();

export const CheckStepSchema = z.object({
  check: SelectorOrStringSchema,
}).strict();

export const UncheckStepSchema = z.object({
  uncheck: SelectorOrStringSchema,
}).strict();

export const UploadParamsSchema = SelectorObjectSchema.extend({
  file: z.union([z.string(), z.array(z.string())]),
}).refine(selectorAtLeastOne, selectorAtLeastOneMsg);

export const UploadStepSchema = z.object({
  upload: UploadParamsSchema,
}).strict();

export const PressKeyParamsSchema = z
  .object({
    key: z.string().min(1),
    // Selector fields (optional — if absent, key press goes to focused element)
    text: z.string().optional(),
    role: z.string().optional(),
    name: z.string().optional(),
    testid: z.string().optional(),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    css: z.string().optional(),
    xpath: z.string().optional(),
    exact: z.boolean().optional(),
    nth: z.number().int().nonnegative().optional(),
  })
  .refine((s) => s.key !== undefined, { message: 'key is required for pressKey' });

export const PressKeyStepSchema = z.object({
  pressKey: z.union([z.string().min(1), PressKeyParamsSchema]),
}).strict();

export const ScrollParamsSchema = z.object({
  direction: z.enum(['up', 'down', 'left', 'right']).optional(),
  amount: z.number().positive().optional(),
  selector: SelectorOrStringSchema.optional(),
});

export const ScrollStepSchema = z.object({
  scroll: ScrollParamsSchema.nullable().optional(),
}).strict();

export const DragAndDropStepSchema = z.object({
  dragAndDrop: z.object({
    source: SelectorOrStringSchema,
    target: SelectorOrStringSchema,
  }),
}).strict();

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

export const AssertVisibleStepSchema = z.object({
  assertVisible: SelectorOrStringSchema,
}).strict();

export const AssertNotVisibleStepSchema = z.object({
  assertNotVisible: SelectorOrStringSchema,
}).strict();

export const AssertTextStepSchema = z.object({
  assertText: SelectorObjectSchema.extend({
    expected: z.string(),
  }).refine(selectorAtLeastOne, selectorAtLeastOneMsg),
}).strict();

export const AssertContainsTextStepSchema = z.object({
  assertContainsText: SelectorObjectSchema.extend({
    contains: z.string(),
  }).refine(selectorAtLeastOne, selectorAtLeastOneMsg),
}).strict();

export const AssertValueStepSchema = z.object({
  assertValue: SelectorObjectSchema.extend({
    expected: z.string(),
  }).refine(selectorAtLeastOne, selectorAtLeastOneMsg),
}).strict();

export const AssertUrlParamsSchema = z.object({
  url: z.string().optional(),
  pattern: z.string().optional(),
});

export const AssertUrlStepSchema = z.object({
  assertUrl: z.union([z.string().min(1), AssertUrlParamsSchema]),
}).strict();

export const AssertTitleParamsSchema = z.object({
  title: z.string().optional(),
  contains: z.string().optional(),
});

export const AssertTitleStepSchema = z.object({
  assertTitle: z.union([z.string().min(1), AssertTitleParamsSchema]),
}).strict();

export const AssertEnabledStepSchema = z.object({
  assertEnabled: SelectorOrStringSchema,
}).strict();

export const AssertDisabledStepSchema = z.object({
  assertDisabled: SelectorOrStringSchema,
}).strict();

export const AssertCheckedStepSchema = z.object({
  assertChecked: SelectorOrStringSchema,
}).strict();

export const AssertUncheckedStepSchema = z.object({
  assertUnchecked: SelectorOrStringSchema,
}).strict();

export const AssertCountStepSchema = z.object({
  assertCount: SelectorObjectSchema.extend({
    count: z.number().int().nonnegative(),
  }).refine(selectorAtLeastOne, selectorAtLeastOneMsg),
}).strict();

export const AssertAttributeStepSchema = z.object({
  assertAttribute: SelectorObjectSchema.extend({
    attribute: z.string().min(1),
    expected: z.string(),
  }).refine(selectorAtLeastOne, selectorAtLeastOneMsg),
}).strict();

export const AssertCssPropertyStepSchema = z.object({
  assertCssProperty: SelectorObjectSchema.extend({
    property: z.string().min(1),
    expected: z.string(),
  }).refine(selectorAtLeastOne, selectorAtLeastOneMsg),
}).strict();

// ---------------------------------------------------------------------------
// Waiting
// ---------------------------------------------------------------------------

export const WaitForElementStepSchema = z.object({
  waitForElement: SelectorOrStringSchema,
}).strict();

export const WaitForUrlStepSchema = z.object({
  waitForUrl: z.union([
    z.string().min(1),
    z.object({
      url: z.string().min(1),
      timeout: z.number().int().positive().optional(),
    }),
  ]),
}).strict();

export const WaitForNetworkIdleStepSchema = z.object({
  waitForNetworkIdle: z
    .object({ timeout: z.number().int().positive().optional() })
    .nullable()
    .optional(),
}).strict();

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export const PauseStepSchema = z.object({
  pause: z.number().int().nonnegative(),
}).strict();

export const ScreenshotStepSchema = z.object({
  screenshot: z
    .object({
      path: z.string().optional(),
      fullPage: z.boolean().optional(),
    })
    .nullable()
    .optional(),
}).strict();

export const LogStepSchema = z.object({
  log: z.string(),
}).strict();

export const RunFlowParamsSchema = z.object({
  path: z.string().min(1),
  env: z.record(z.string()).optional(),
});

export const RunFlowStepSchema = z.object({
  runFlow: z.union([z.string().min(1), RunFlowParamsSchema]),
}).strict();

export const EvaluateStepSchema = z.object({
  evaluate: z.object({
    script: z.string().min(1),
    args: z.array(z.unknown()).optional(),
    description: z.string().optional(),
  }),
}).strict();

// ---------------------------------------------------------------------------
// Union of all step schemas
// ---------------------------------------------------------------------------

export const StepSchema = z.union([
  NavigateStepSchema,
  ReloadStepSchema,
  GoBackStepSchema,
  GoForwardStepSchema,
  ClickStepSchema,
  DoubleClickStepSchema,
  HoverStepSchema,
  FocusStepSchema,
  FillStepSchema,
  TypeStepSchema,
  SelectStepSchema,
  CheckStepSchema,
  UncheckStepSchema,
  UploadStepSchema,
  PressKeyStepSchema,
  ScrollStepSchema,
  DragAndDropStepSchema,
  AssertVisibleStepSchema,
  AssertNotVisibleStepSchema,
  AssertTextStepSchema,
  AssertContainsTextStepSchema,
  AssertValueStepSchema,
  AssertUrlStepSchema,
  AssertTitleStepSchema,
  AssertEnabledStepSchema,
  AssertDisabledStepSchema,
  AssertCheckedStepSchema,
  AssertUncheckedStepSchema,
  AssertCountStepSchema,
  AssertAttributeStepSchema,
  AssertCssPropertyStepSchema,
  WaitForElementStepSchema,
  WaitForUrlStepSchema,
  WaitForNetworkIdleStepSchema,
  PauseStepSchema,
  ScreenshotStepSchema,
  LogStepSchema,
  RunFlowStepSchema,
  EvaluateStepSchema,
]);

export type StepSchemaType = z.infer<typeof StepSchema>;
