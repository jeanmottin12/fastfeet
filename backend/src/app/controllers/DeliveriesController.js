import * as Yup from 'yup';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';
import { Op } from 'sequelize';

class DeliveriesController {
  async index(req, res) {
    const { id } = req.params;
    const { page = 1 } = req.query;

    const orders = await Order.findAll({
      where: {
        deliveryman_id: id,
        canceled_at: null,
        end_date: null,
      },
      attributes: ['id', 'product', 'start_date', 'end_date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'name'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(orders);
  }

  async show(req, res) {
    const { id } = req.params;

    const orders = await Order.findAll({
      where: {
        deliveryman_id: id,
        end_date: {
          [Op.not]: null,
        },
      },
      attributes: ['id', 'product', 'canceled_at', 'start_date', 'end_date'],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'name'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(orders);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      deliveryman_id: Yup.number()
        .integer()
        .required(),
      signature_id: Yup.number().integer(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(401).json({ error: 'Validation fails!' });
    }

    const { orderId } = req.params;
    const { deliveryman_id, signature_id } = req.body;

    /**
     * Check if Deliveryman exists
     */
    const deliveryman = await Deliveryman.findByPk(deliveryman_id);

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found.' });
    }

    /**
     * Check if order exists
     */
    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(400).json({ error: 'Order not found!' });
    }

    /**
     * Check if order belongs to deliveryman
     */
    if (order.deliveryman_id !== deliveryman_id) {
      return res
        .status(401)
        .json({ error: 'This order was not from this deliveryman ' });
    }

    /**
     * Check if order was not canceled
     */
    if (order.canceled_at !== null) {
      return res
        .status(401)
        .json({ error: `This order was canceled at ${order.canceled_at}` });
    }

    order.end_date = new Date();

    await order.save();

    await order.update({ signature_id });

    return res.json({ message: 'Order end_date was set' });
  }
}

export default new DeliveriesController();
