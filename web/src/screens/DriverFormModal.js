import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabaseAdmin } from '../lib/supabaseAdminClient';
import { supabase } from '../lib/supabaseClient';
import { X } from 'lucide-react';
export default function DriverFormModal({ onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (!formData.name.trim())
                throw new Error('Name is required');
            if (!formData.email.trim())
                throw new Error('Email is required');
            if (formData.password.length < 6)
                throw new Error('Password must be at least 6 characters');
            // 1. Create user in auth via admin client
            const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
                email: formData.email,
                password: formData.password,
                email_confirm: true,
            });
            if (authErr)
                throw authErr;
            if (!authData.user)
                throw new Error('Failed to create user');
            // 2. Insert into profiles via normal client
            // (Assuming the profile is either auto-created by a trigger or we need to upsert)
            const { error: profileErr } = await supabase
                .from('profiles')
                .upsert({
                id: authData.user.id,
                email: formData.email,
                full_name: formData.name,
                role: 'driver',
            });
            if (profileErr) {
                // If there's an error upserting profile, we log it, but the user is created
                console.error('Profile upsert error:', profileErr);
                // It might be auto-created by a trigger, so let's try updating it instead
                const { error: updateErr } = await supabase
                    .from('profiles')
                    .update({
                    full_name: formData.name,
                    role: 'driver',
                })
                    .eq('id', authData.user.id);
                if (updateErr)
                    throw new Error(`User created, but profile update failed: ${updateErr.message}`);
            }
            onSave();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    return createPortal(_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden", children: [_jsxs("div", { className: "flex justify-between items-center p-6 border-b border-gray-100", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Add New Driver" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 transition", children: _jsx(X, { size: 24 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", autoComplete: "off", children: [error && (_jsx("div", { className: "bg-red-50 text-red-700 p-3 rounded-lg text-sm", children: error })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Full Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading, placeholder: "Driver's Full Name" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email Address *" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading, placeholder: "driver@smartbus.com", autoComplete: "new-email", "data-1p-ignore": true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Password *" }), _jsx("input", { type: "password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: loading, placeholder: "Minimum 6 characters", autoComplete: "new-password", "data-1p-ignore": true })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: "flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50", disabled: loading, children: loading ? 'Creating...' : 'Create Driver' })] })] })] }) }), document.body);
}
