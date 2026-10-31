/*
 * The hexagonal island geometry below is adapted from Portfolio v3.0.1,
 * src/components/explorer/HexIsland.tsx. Copyright (c) 2026 LeoChen.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/** Generic decorative geometry. The host adapter owns categories and destinations. */
export function HexHub({ label, index, selected, onSelect }: {
  label: string; index: number; selected: boolean; onSelect: () => void;
}) {
  return <button type="button" className={`civic-hub civic-hub-${index}`} aria-pressed={selected} onClick={onSelect}>
    <svg viewBox="0 0 220 180" aria-hidden="true" focusable="false">
      <ellipse cx="110" cy="155" rx="87" ry="20" className="civic-shadow" />
      <g className="civic-lift">
        <polygon points="24,105 110,147 110,166 24,124" className="civic-side-left" />
        <polygon points="110,147 196,105 196,124 110,166" className="civic-side-right" />
        <polygon points="110,23 196,64 196,105 110,147 24,105 24,64" className="civic-top" />
        <polygon points="110,33 185,69 185,100 110,136 35,100 35,69" className="civic-inset" />
        <path d="M65 86 110 64l45 22-45 22z M80 91v18l30 14 30-14V91 M110 108v15" className="civic-mark" />
      </g>
    </svg>
    <span><small aria-hidden="true">0{index + 1} / </small>{label}</span>
  </button>;
}
