//import dei componenti necessari

import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {
    Box,
    Typography,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Divider, ListItemIcon
} from '@mui/material';

//import delle icone
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ChatIcon from '@mui/icons-material/Chat';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';

import {BACKEND_URL} from "../config/config";
import axios from "axios";

const Menu = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        //chiamata http con Axios con autenticazione per recuperare le info dell'utente attualmente loggato
        const fetchUser = async () => {
            const token = localStorage.getItem('accessToken');
            try {
                const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization:  `Bearer ${token}`,
                    },
                    withCredentials: true,
                });
                setUser(res.data);
            } catch (err) {
                console.error('Errore nel recupero dati utente:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    //funzione che gestisce il logout
    const handleLogout = async () => {
        try {
            await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, {
                withCredentials: true,
            });
            localStorage.removeItem('accessToken'); //rimozione dell' accessToken da localStorage
            navigate('/login'); //redirect a login
        } catch (error) {
            console.error("Errore durante il logout: ", error);
        }
    }

    //funzione gestore apertura menu laterale
    const toggleDrawer = (open) => {
        setDrawerOpen(open);
    };

    //definizione link per i vari nomi dei pulsanti
    const menuItems = [
        { label: 'Dashboard', path: '/user'},
        { label: 'Area Riservata', path: '/profile' },
        { label: 'Ordini' , path: '/orders' },
        { label: 'Consegne' , path: '/deliveries' },
        { label: 'Catalogo' , path: '/catalogue' },
        { label: 'Chat' , path: '/chat' },
    ];

    const iconMap = {
        '/user' : <DashboardIcon sx={{ color: '#ffffff'}} />,
        '/profile' : <AccountCircleIcon sx={{ color: '#ffffff'}}/>,
        '/orders' : <ShoppingCartIcon sx={{ color: '#ffffff'}} />,
        '/deliveries' : <LocalShippingIcon sx={{ color: '#ffffff'}} />,
        '/catalogue' : <StorefrontIcon sx={{ color: '#ffffff'}} />,
        '/chat' : <ChatIcon sx={{ color: '#ffffff'}} />,
        logout : <LogoutIcon sx={{ color: 'red'}} />
    }

    //funzione gestore tasti del menu
    const handleMenuClick = (item) => {
        setDrawerOpen(false);
        if (item.path) navigate(item.path);
    }

    //componente menu laterale
    return (
        <Box sx={{ p: 3}}>
            <IconButton color="inherit" onClick={() => toggleDrawer(true)}>
                <MenuIcon />
            </IconButton>

            <Drawer anchor="right" open={drawerOpen} onClose={() => toggleDrawer(false)}>
                <Box
                    sx={{ width: 250, backgroundColor: '#bbd6ee', height: '100%' }}
                    role="presentation"
                    onClick={() => toggleDrawer(false)}
                    onKeyDown={() => toggleDrawer(false)}
                >
                    <Typography sx={{ p:2, fontSize: '2rem' }}>Ciao{user?.nome?`, ${user.nome}`:''}</Typography>
                   <List>
                       {menuItems.map((item, index) => (
                           <ListItem key={index} disablePadding>
                               <ListItemButton onClick={() => handleMenuClick(item)}>
                                   <ListItemIcon>
                                       {iconMap[item.path]}
                                   </ListItemIcon>
                                   <ListItemText primary={item.label} />
                               </ListItemButton>
                           </ListItem>
                       ))}
                   </List>
                   <Divider sx={{ backgroundColor: '#444'}}/>
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton onClick={handleLogout}>
                                <ListItemIcon>
                                    {iconMap.logout}
                                </ListItemIcon>
                                <ListItemText primary="Logout" sx={{ color: "red "}} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
        </Box>
    )
}
export default Menu;