'use client';
import React, { useEffect, useState } from 'react';
import { Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { UserDataType } from "@/app/hooks/useUserData";
import scss from './logout.module.scss';

const LogoutPage = () => {
    const [userData, setUserData] = useState<UserDataType | null>(null);
    const router = useRouter();

    useEffect(() => {
        const userDataCookie = Cookies.get('userData');

        if (!userDataCookie) {
            setUserData(null);
            return;
        }

        try {
            const parsedUserData = JSON.parse(userDataCookie) as UserDataType;
            setUserData(parsedUserData);
        } catch {
            Cookies.remove('userData');
            setUserData(null);
        }
    }, []);

    const handleSignOut = () => {
        Cookies.remove('userData');
        setUserData(null);
        router.push('/login');
    };

    const handleSignIn = () => {
        router.push('/login');
    };

    return (
        <div className={scss.logout}>
            {userData?.isLoggedIn ? (
                <>
                    <Typography variant={'h6'}>Are you sure you want to sign out?</Typography>
                    <Button variant="contained" onClick={handleSignOut}>
                        Sign Out
                    </Button>
                </>
            ) : (
                <>
                    <Typography variant={'h6'}>Thank you for signing out</Typography>
                    <Button variant="contained" onClick={handleSignIn}>
                        Sign In
                    </Button>
                </>
            )}
        </div>
    );
};

export default LogoutPage;