import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ZoomableBracket } from '@/components/competitor/ZoomableBracket';

const CONTENT_WIDTH = 2000;
const CONTENT_HEIGHT = 1200;

function mockViewportSize(viewport: HTMLElement, width: number, height: number) {
  Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: height });
}

function renderBracket(children: React.ReactNode = null) {
  return render(
    <ZoomableBracket contentWidth={CONTENT_WIDTH} contentHeight={CONTENT_HEIGHT}>
      {children ?? (
        <div data-testid="matches">
          <div>Match 1</div>
          <div>Match 2</div>
          <div>Match 3</div>
        </div>
      )}
    </ZoomableBracket>,
  );
}

function zoomLevel(): string {
  return screen.getByRole('status').textContent ?? '';
}

function viewport(): HTMLElement {
  return screen.getByTestId('bracket-viewport');
}

afterEach(() => {
  cleanup();
});

describe('ZoomableBracket', () => {
  it('renders bracket content and accessible navigation controls', () => {
    renderBracket();

    expect(screen.getByText('Match 1')).toBeTruthy();
    expect(screen.getByText('Match 2')).toBeTruthy();
    expect(screen.getByText('Match 3')).toBeTruthy();

    expect(screen.getByRole('button', { name: /zoom in/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /fit to screen/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /reset zoom/i })).toBeTruthy();
    expect(zoomLevel()).toBe('100%');
  });

  it('zoom in increases the zoom level', () => {
    renderBracket();
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(zoomLevel()).toBe('125%');
  });

  it('zoom out decreases the zoom level', () => {
    renderBracket();
    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
    expect(zoomLevel()).toBe('80%');
  });

  it('clamps zoom in at the upper bound (300%)', () => {
    renderBracket();
    for (let i = 0; i < 20; i++) {
      fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    }
    expect(zoomLevel()).toBe('300%');
  });

  it('clamps zoom out at the lower bound (5%)', () => {
    renderBracket();
    for (let i = 0; i < 30; i++) {
      fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
    }
    expect(zoomLevel()).toBe('5%');
  });

  it('reset returns to 100% and clears scroll', () => {
    renderBracket();
    const vp = viewport();
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    vp.scrollLeft = 300;
    vp.scrollTop = 150;

    fireEvent.click(screen.getByRole('button', { name: /reset zoom/i }));

    expect(zoomLevel()).toBe('100%');
    expect(vp.scrollLeft).toBe(0);
    expect(vp.scrollTop).toBe(0);
  });

  it('fit to screen scales the bracket to fit the viewport and centers it', () => {
    renderBracket();
    const vp = viewport();
    mockViewportSize(vp, 1000, 400);

    fireEvent.click(screen.getByRole('button', { name: /fit to screen/i }));

    // min(1, 1000/2000, 400/1200) = 1/3
    expect(zoomLevel()).toBe('33%');
  });

  it('fit to screen never zooms beyond 100%', () => {
    renderBracket();
    const vp = viewport();
    mockViewportSize(vp, 5000, 3000);

    fireEvent.click(screen.getByRole('button', { name: /fit to screen/i }));

    expect(zoomLevel()).toBe('100%');
  });

  it('ctrl+wheel zooms about the cursor and keeps the focal point fixed', () => {
    renderBracket();
    const vp = viewport();
    vp.scrollLeft = 0;
    vp.scrollTop = 0;

    fireEvent.wheel(vp, { ctrlKey: true, deltaY: -100, clientX: 100, clientY: 50 });

    expect(zoomLevel()).toBe('125%');
    // focalX = 100 + 0 = 100; ratio = 1.25 => scrollLeft = 0 + 100 * 0.25 = 25
    expect(vp.scrollLeft).toBeCloseTo(25, 5);
    // focalY = 50; scrollTop = 0 + 50 * 0.25 = 12.5
    expect(vp.scrollTop).toBeCloseTo(12.5, 5);
  });

  it('plain wheel does not change the zoom level (native scrolling preserved)', () => {
    renderBracket();
    fireEvent.wheel(viewport(), { deltaY: -100, clientX: 100, clientY: 50 });
    expect(zoomLevel()).toBe('100%');
  });

  it('dragging pans the bracket by the pointer delta', () => {
    renderBracket();
    const vp = viewport();
    vp.scrollLeft = 0;
    vp.scrollTop = 0;

    fireEvent.mouseDown(vp, { button: 0, clientX: 100, clientY: 100 });
    fireEvent.mouseMove(window, { clientX: 160, clientY: 140 });
    fireEvent.mouseUp(window);

    expect(vp.scrollLeft).toBe(-60);
    expect(vp.scrollTop).toBe(-40);
  });

  it('a click that follows a drag is suppressed (does not select a match)', () => {
    const onMatchClick = vi.fn();
    render(
      <ZoomableBracket contentWidth={CONTENT_WIDTH} contentHeight={CONTENT_HEIGHT}>
        <button data-testid="match" onClick={onMatchClick}>
          Match A
        </button>
      </ZoomableBracket>,
    );
    const vp = viewport();

    fireEvent.mouseDown(vp, { button: 0, clientX: 100, clientY: 100 });
    fireEvent.mouseMove(window, { clientX: 200, clientY: 100 });
    fireEvent.mouseUp(window);
    fireEvent.click(screen.getByTestId('match'));

    expect(onMatchClick).not.toHaveBeenCalled();

    // A normal click afterwards works as expected.
    fireEvent.click(screen.getByTestId('match'));
    expect(onMatchClick).toHaveBeenCalledTimes(1);
  });

  it('a plain click on a match is not suppressed', () => {
    const onMatchClick = vi.fn();
    render(
      <ZoomableBracket contentWidth={CONTENT_WIDTH} contentHeight={CONTENT_HEIGHT}>
        <button data-testid="match" onClick={onMatchClick}>
          Match B
        </button>
      </ZoomableBracket>,
    );

    fireEvent.click(screen.getByTestId('match'));

    expect(onMatchClick).toHaveBeenCalledTimes(1);
  });

  it('zooming does not modify the bracket content or its data', () => {
    renderBracket();
    const matches = screen.getByTestId('matches');
    const before = matches.innerHTML;

    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    fireEvent.click(screen.getByRole('button', { name: /fit to screen/i }));
    fireEvent.click(screen.getByRole('button', { name: /reset zoom/i }));

    expect(screen.getByTestId('matches')).toBe(matches);
    expect(matches.innerHTML).toBe(before);
    expect(screen.getByText('Match 1')).toBeTruthy();
    expect(screen.getByText('Match 2')).toBeTruthy();
    expect(screen.getByText('Match 3')).toBeTruthy();
  });
});
