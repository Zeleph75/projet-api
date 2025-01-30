import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from '../hooks/useForm';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SocialLogin from '../components/auth/SocialLogin';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm({
        email: '',
        password: '',
    });

    const onSubmit = async (formValues) => {
        await login(formValues.email, formValues.password);
        const from = (location.state?.from?.pathname) || '/dashboard';
        navigate(from, { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                </div>
                <form
                    className="mt-8 space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(onSubmit);
                    }}
                >
                    <div className="rounded-md shadow-sm space-y-4">
                        <Input
                            label="Email address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={values.email}
                            onChange={handleChange}
                            error={errors.email}
                        />
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={values.password}
                            onChange={handleChange}
                            error={errors.password}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                                Forgot your password?
                            </a>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        className="w-full"
                    >
                        Sign in
                    </Button>

                    <SocialLogin />
                </form>
            </div>
        </div>
    );
};

export default Login;
