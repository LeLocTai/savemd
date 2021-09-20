type Images = { [key: string]: string }

interface Page
{
    url: string;
    title: string;
    md: string;
    imgs: Images;
}