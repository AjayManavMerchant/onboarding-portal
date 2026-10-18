import { ITEM_LABELS } from "@/lib/labels";
import type { Requirement, RequirementKind } from "@/lib/types";

export function ChecklistTable({
  kind,
  items,
  isDone,
  onToggle,
  readOnly = false,
}: {
  kind: RequirementKind;
  items: Requirement[];
  isDone: (reqId: string) => boolean;
  onToggle: (reqId: string, checked: boolean) => void;
  readOnly?: boolean;
}) {
  const access = kind === "ACCESS";
  const linkText = access ? "Open procedure" : "Open training";
  return (
    <div className="relative overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th scope="col" className="w-12 px-2 py-2 font-medium sm:px-3">S.No.</th>
            <th scope="col" className="px-2 py-2 font-medium sm:px-3">Name</th>
            <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">{access ? "Procedure link" : "Training link"}</th>
            <th scope="col" className="w-24 px-2 py-2 text-center font-medium sm:w-28 sm:px-3">Completed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((r, i) => {
            const done = isDone(r.id);
            return (
              <tr key={r.id} className={done ? "bg-green-50/50" : undefined}>
                <td className="px-2 py-2 sm:px-3">{i + 1}</td>
                <td className="px-2 py-2 sm:px-3">
                  {r.name}
                  {/* On narrow screens the link sits under the name so the checkbox stays in view. */}
                  <a href={r.link} target="_blank" rel="noopener noreferrer" className="link mt-1 block text-xs sm:hidden">
                    {linkText}
                  </a>
                </td>
                <td className="hidden whitespace-nowrap px-3 py-2 sm:table-cell">
                  <a href={r.link} target="_blank" rel="noopener noreferrer" className="link">
                    {linkText}
                  </a>
                </td>
                <td className="px-2 py-1 text-center sm:px-3">
                  <label className="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center has-disabled:cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={done}
                      disabled={readOnly}
                      onChange={(e) => onToggle(r.id, e.target.checked)}
                      aria-label={r.name}
                      className="size-5 accent-green-600"
                    />
                    <span className="sr-only">{done ? ITEM_LABELS.done : ITEM_LABELS.notDone}</span>
                  </label>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
