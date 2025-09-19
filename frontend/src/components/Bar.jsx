//import dei componenti necessari
import {AppBar, Box, Toolbar} from "@mui/material";
import Menu from "./Menu";
import React from "react";

const Bar = () => {
    //barra superiore colorata
    return (
        <AppBar position="static" sx={{ backgroundColor: "#abeece" }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between"}}>
                <Box sx={{ display: "flex", alignItems: "center"}}>
                    <img src="/logo_full_AHC.png" alt="Logo AHC" style={{ height: 50 }} />
                </Box>
                {/* Inserimento del menù laterale a destra nella barra */}
                <Box sx={{ display: "flex", alignItems: "center"}}>
                    <Menu/>
                </Box>
            </Toolbar>
        </AppBar>
    )
}

export default Bar;