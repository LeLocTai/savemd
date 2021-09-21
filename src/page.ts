type Images = { [key: string]: string }

interface Page
{
    url: string;
    title: string;
    shortTitle: string;
    md: string;
    imgs: Images;
}