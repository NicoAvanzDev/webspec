/**
 * Interaction command handlers:
 *   click, doubleClick, hover, focus, fill, type, select,
 *   check, uncheck, upload, pressKey, scroll, dragAndDrop
 */

import type { ExecutionContext } from '../context';
import { resolveLocator, describeSelector } from '../../core/resolveSelectors';
import type {
  ClickStep,
  DoubleClickStep,
  HoverStep,
  FocusStep,
  FillStep,
  TypeStep,
  SelectStep,
  CheckStep,
  UncheckStep,
  UploadStep,
  PressKeyStep,
  ScrollStep,
  DragAndDropStep,
} from '../../types/spec';

export async function handleClick(step: ClickStep, ctx: ExecutionContext): Promise<void> {
  const loc = resolveLocator(ctx.page, step.click);
  await loc.click({ timeout: ctx.timeout });
}

export async function handleDoubleClick(step: DoubleClickStep, ctx: ExecutionContext): Promise<void> {
  const loc = resolveLocator(ctx.page, step.doubleClick);
  await loc.dblclick({ timeout: ctx.timeout });
}

export async function handleHover(step: HoverStep, ctx: ExecutionContext): Promise<void> {
  const loc = resolveLocator(ctx.page, step.hover);
  await loc.hover({ timeout: ctx.timeout });
}

export async function handleFocus(step: FocusStep, ctx: ExecutionContext): Promise<void> {
  const loc = resolveLocator(ctx.page, step.focus);
  await loc.focus({ timeout: ctx.timeout });
}

export async function handleFill(step: FillStep, ctx: ExecutionContext): Promise<void> {
  const { value, clear: _clear, ...selector } = step.fill;
  const loc = resolveLocator(ctx.page, selector);
  await loc.fill(value, { timeout: ctx.timeout });
}

export async function handleType(step: TypeStep, ctx: ExecutionContext): Promise<void> {
  const { value, delay, ...selector } = step.type;
  const loc = resolveLocator(ctx.page, selector);
  await loc.pressSequentially(value, { delay: delay ?? 0 });
}

export async function handleSelect(step: SelectStep, ctx: ExecutionContext): Promise<void> {
  const { value, ...selector } = step.select;
  const loc = resolveLocator(ctx.page, selector);
  const values = Array.isArray(value) ? value : [value];
  await loc.selectOption(values, { timeout: ctx.timeout });
}

export async function handleCheck(step: CheckStep, ctx: ExecutionContext): Promise<void> {
  const loc = resolveLocator(ctx.page, step.check);
  await loc.check({ timeout: ctx.timeout });
}

export async function handleUncheck(step: UncheckStep, ctx: ExecutionContext): Promise<void> {
  const loc = resolveLocator(ctx.page, step.uncheck);
  await loc.uncheck({ timeout: ctx.timeout });
}

export async function handleUpload(step: UploadStep, ctx: ExecutionContext): Promise<void> {
  const { file, ...selector } = step.upload;
  const loc = resolveLocator(ctx.page, selector);
  const files = Array.isArray(file) ? file : [file];
  await loc.setInputFiles(files);
}

export async function handlePressKey(step: PressKeyStep, ctx: ExecutionContext): Promise<void> {
  const raw = step.pressKey;
  if (typeof raw === 'string') {
    await ctx.page.keyboard.press(raw);
    return;
  }
  const { key, ...selectorFields } = raw;
  // Check if any selector fields exist
  const hasSelector = Object.keys(selectorFields).some(
    (k) => ['text', 'role', 'testid', 'label', 'placeholder', 'css', 'xpath'].includes(k),
  );
  if (hasSelector) {
    const loc = resolveLocator(ctx.page, selectorFields);
    await loc.press(key, { timeout: ctx.timeout });
  } else {
    await ctx.page.keyboard.press(key);
  }
}

export async function handleScroll(step: ScrollStep, ctx: ExecutionContext): Promise<void> {
  const params = step.scroll ?? {};
  const direction = params.direction ?? 'down';
  const amount = params.amount ?? 300;

  const deltaX = direction === 'left' ? -amount : direction === 'right' ? amount : 0;
  const deltaY = direction === 'up' ? -amount : direction === 'down' ? amount : 0;

  if (params.selector) {
    const loc = resolveLocator(ctx.page, params.selector);
    await loc.evaluate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ([dx, dy]: number[]) => (globalThis as any).scrollBy(dx ?? 0, dy ?? 0),
      [deltaX, deltaY] as number[],
    );
  } else {
    await ctx.page.evaluate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ([dx, dy]: number[]) => (globalThis as any).scrollBy(dx ?? 0, dy ?? 0),
      [deltaX, deltaY] as number[],
    );
  }
}

export async function handleDragAndDrop(step: DragAndDropStep, ctx: ExecutionContext): Promise<void> {
  const src = resolveLocator(ctx.page, step.dragAndDrop.source);
  const tgt = resolveLocator(ctx.page, step.dragAndDrop.target);
  await src.dragTo(tgt, { timeout: ctx.timeout });
}

// ---------------------------------------------------------------------------
// Describe helpers for logging
// ---------------------------------------------------------------------------

export const describeClick = (s: ClickStep): string => `click ${describeSelector(s.click)}`;
export const describeDoubleClick = (s: DoubleClickStep): string => `doubleClick ${describeSelector(s.doubleClick)}`;
export const describeHover = (s: HoverStep): string => `hover ${describeSelector(s.hover)}`;
export const describeFocus = (s: FocusStep): string => `focus ${describeSelector(s.focus)}`;
export const describeFill = (s: FillStep): string => {
  const { value, clear: _c, ...sel } = s.fill;
  return `fill ${describeSelector(sel)} → "${value}"`;
};
export const describeType = (s: TypeStep): string => {
  const { value, delay: _d, ...sel } = s.type;
  return `type ${describeSelector(sel)} → "${value}"`;
};
export const describeSelect = (s: SelectStep): string => {
  const { value, ...sel } = s.select;
  return `select ${describeSelector(sel)} → "${Array.isArray(value) ? value.join(', ') : value}"`;
};
export const describeCheck = (s: CheckStep): string => `check ${describeSelector(s.check)}`;
export const describeUncheck = (s: UncheckStep): string => `uncheck ${describeSelector(s.uncheck)}`;
export const describeUpload = (s: UploadStep): string => {
  const { file, ...sel } = s.upload;
  return `upload ${describeSelector(sel)} ← "${Array.isArray(file) ? file.join(', ') : file}"`;
};
export const describePressKey = (s: PressKeyStep): string => {
  const raw = s.pressKey;
  return `pressKey "${typeof raw === 'string' ? raw : raw.key}"`;
};
export const describeScroll = (s: ScrollStep): string => {
  const p = s.scroll ?? {};
  return `scroll ${p.direction ?? 'down'} ${p.amount ?? 300}px`;
};
export const describeDragAndDrop = (s: DragAndDropStep): string =>
  `dragAndDrop ${describeSelector(s.dragAndDrop.source)} → ${describeSelector(s.dragAndDrop.target)}`;
