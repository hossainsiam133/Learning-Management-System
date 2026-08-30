// useUserData.ts
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export type UserDataType = {
    authToken: string;
    userId?: number;
    userName: string;
    isLoggedIn: boolean;
    roleName?: string;
};

const useUserData = () => {
    const [userData, setUserData] = useState<UserDataType | null>(null);

    const readUserData = () => {
        try {
            const userDataCookie = Cookies.get('userData');
            if (!userDataCookie) {
                return null;
            }

            return JSON.parse(userDataCookie) as UserDataType;
        } catch {
            Cookies.remove('userData');
            return null;
        }
    };

    useEffect(() => {
        setUserData(readUserData());

        const storageEventListener = (event: StorageEvent) => {
            if (event.key !== 'userData') {
                return;
            }

            const nextValue = event.newValue;
            if (!nextValue) {
                setUserData(null);
                return;
            }

            try {
                setUserData(JSON.parse(nextValue) as UserDataType);
            } catch {
                setUserData(null);
            }
        };

        window.addEventListener('storage', storageEventListener);

        return () => {
            window.removeEventListener('storage', storageEventListener);
        };
    }, []);

    return userData;
};

export default useUserData;