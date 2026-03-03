import React from 'react';

export function Table({ columns, data, onEdit, onDelete }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-[#f8fafc]">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                scope="col"
                                className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                            >
                                {col.label}
                            </th>
                        ))}
                        {(onEdit || onDelete) && (
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {data.map((row) => (
                        <tr key={row.id}>
                            {columns.map((col) => (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                            {(onEdit || onDelete) && (
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(row)}
                                            className="text-teal-600 hover:text-teal-700 font-bold text-xs uppercase"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(row)}
                                            className="text-rose-600 hover:text-rose-700 font-bold text-xs uppercase"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={columns.length + ((onEdit || onDelete) ? 1 : 0)} className="px-6 py-4 text-center text-sm text-gray-500">
                                No records found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
