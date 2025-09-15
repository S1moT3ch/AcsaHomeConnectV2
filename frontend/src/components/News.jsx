//import dei componenti necessari
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Paper, Typography, List, ListItem, ListItemText, Link } from '@mui/material';
import {NEWS_API_KEY} from "../config/config";

const News = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);




    useEffect(() => {
        //chiamata http con Axios ad un'API di NewsAPI per recuperare alcune notizie di attualità
        const fetchNews = async () => {
            try {
                const res = await axios.get(
                    `https://gnews.io/api/v4/search?q=italia&sortby=publishedAt&token=${NEWS_API_KEY}&lang=it`
                );
                setNews(res.data.articles);
            } catch (err) {
                setError('Impossibile caricare le news');
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    if (loading) return <Typography>Caricamento news...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    //componente news con le relative informazioni
    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                News Italia
            </Typography>
            <List>
                {/* seleziona solo le prime tre notizie */}
                {news.slice(0, 3).map((article, index) => (
                    <ListItem key={index}>
                        <ListItemText
                            primary={
                                <Link href={article.url} target="_blank" rel="noopener noreferrer">
                                    {article.title}
                                </Link>
                            }
                            secondary={article.source.name}
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default News;